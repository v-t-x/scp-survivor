import {
  chromium,
  openGame,
  beginMission,
  capture,
  inScene,
  assert,
  fs,
  path,
  output
} from './u3-browser-support.mjs';

const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const report = {
  origin: 'http://127.0.0.1:49183',
  browser: 'Microsoft Edge (Playwright channel msedge, headless)',
  storage: 'fresh ephemeral contexts, never the user browser profile',
  stateSource: 'test-only response instrumentation and isolated in-memory scene state; config modules are not mutated',
  checks: [],
  errors: []
};

function record(name, detail) {
  report.checks.push({ name, passed: true, detail });
  console.log(`PASS ${name}`);
}

async function withGame(run) {
  const session = await openGame(browser, { width: 960, height: 540, dpr: 1 });
  try {
    await run(session.page);
    report.errors.push(...session.errors);
  } finally {
    await session.context.close();
  }
}

async function showChoices(page, keys, { clones = {} } = {}) {
  await page.evaluate(async ({ keys, clones }) => {
    const scene = window.__u3TestGame.scene.getScene('PrototypeScene');
    const { UPGRADE_DEFINITIONS } = await import('/src/config/upgrades.js');
    const choices = keys.map((key) => {
      const original = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.key === key);
      return Object.hasOwn(clones, key) ? { ...original, ...clones[key] } : original;
    });
    const originalGetter = scene.getLevelUpChoices;
    scene.getLevelUpChoices = () => choices;
    scene.pendingLevelUps = 1;
    scene.rerollsRemaining = 3;
    scene.showLevelUpOverlay();
    scene.getLevelUpChoices = originalGetter;
  }, { keys, clones });
  await page.locator('[data-scp-u3="upgrade"]').waitFor({ state: 'visible' });
  await page.waitForTimeout(80);
}

async function dismissUpgrade(page) {
  await inScene(page, (scene) => {
    scene.destroyLevelUpOverlay();
    scene.isLevelUpActive = false;
    scene.isResolvingLevelUp = false;
    scene.pendingLevelUps = 0;
    scene.resumeGameplaySystems();
  });
}

try {
  await withGame(async (page) => {
    await beginMission(page, 'tesla');
    await showChoices(page, ['damage', 'attackSpeed', 'teslaChains']);
    const cards = page.locator('.u3-upgrade-card');
    const text = await page.locator('[data-scp-u3="upgrade"]').innerText();
    const aria = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')));
    assert.match(text, /每跳伤害/);
    assert.match(text, /攻击节奏/);
    assert.match(text, /结算间隔/);
    assert.match(text, /电击伤害更密集/);
    assert.match(text, /额外链击/);
    assert.match(text, /命中目标/);
    assert.equal(await cards.nth(0).isDisabled(), false);
    assert.equal(await cards.nth(1).isDisabled(), false);
    assert.equal(await cards.nth(2).isDisabled(), false);
    await capture(page, 'extra-tesla-upgrade-normal');
    record('Tesla normal upgrade wording and availability', {
      cards: aria,
      expectedSemantics: ['damage is per tick', 'attack cadence is settlement interval', 'chain selection reports target count']
    });
  });

  await withGame(async (page) => {
    await beginMission(page, 'tesla');
    await page.evaluate(async () => {
      const scene = window.__u3TestGame.scene.getScene('PrototypeScene');
      const { UPGRADE_DEFINITIONS } = await import('/src/config/upgrades.js');
      const { isPlayerUpgradeVisible } = await import('/src/config/playerWeaponAvailability.js');
      const relevant = UPGRADE_DEFINITIONS.filter((upgrade) =>
        isPlayerUpgradeVisible(upgrade)
        && (upgrade.kind === 'generic' || upgrade.weaponId == null || upgrade.weaponId === 'tesla')
      );
      for (const upgrade of relevant) {
        const attempts = upgrade.isMutation ? 1 : 4;
        for (let index = 0; index < attempts && upgrade.isAvailable(scene); index += 1) {
          upgrade.apply(scene);
          scene.upgradeLevels[upgrade.key] += 1;
          if (upgrade.kind === 'weapon') scene.weapons.tesla.currentLevel += 1;
        }
      }
      scene.health = Math.min(scene.health, scene.maxHealth - 17);
      scene.updateUI();
      scene.toggleBuildPanel();
    });
    const root = page.locator('[data-scp-u3="build"]');
    await root.waitFor({ state: 'visible' });
    const scroll = root.locator('.u3-build-scroll');
    const weaponScroll = root.locator('.u3-build-weapons');
    const expectedNames = await page.evaluate(async () => {
      const { UPGRADE_DEFINITIONS } = await import('/src/config/upgrades.js');
      const { isPlayerUpgradeVisible } = await import('/src/config/playerWeaponAvailability.js');
      return UPGRADE_DEFINITIONS.filter(isPlayerUpgradeVisible).map(({ name }) => name);
    });
    const buildText = await root.innerText();
    for (const name of expectedNames) assert.ok(buildText.includes(name), `build must contain ${name}`);
    assert.match(buildText, /常驻电场\s*已激活/);

    const topGeometry = await scroll.evaluate((node) => {
      node.scrollTop = 0;
      const bounds = node.getBoundingClientRect();
      const rows = [...node.querySelectorAll('.u3-build-upgrade')];
      const first = rows[0].getBoundingClientRect();
      const horizontalOverflow = rows.filter((row) => {
        const box = row.getBoundingClientRect();
        return box.left < bounds.left - 1 || box.right > bounds.right + 1;
      }).map((row) => row.textContent.trim());
      return {
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        scrollTop: node.scrollTop,
        firstRowVisible: first.top >= bounds.top - 1 && first.bottom <= bounds.bottom + 1,
        allRowsWithinScrollableExtent: rows.every((row) =>
          row.offsetTop >= 0 && row.offsetTop + row.offsetHeight <= node.scrollHeight + 1
        ),
        horizontalOverflow,
        rowCount: rows.length
      };
    });
    assert.ok(topGeometry.scrollHeight > topGeometry.clientHeight, 'late build must provide a real scroll range');
    assert.equal(topGeometry.firstRowVisible, true);
    assert.equal(topGeometry.allRowsWithinScrollableExtent, true);
    assert.deepEqual(topGeometry.horizontalOverflow, []);
    await capture(page, 'extra-tesla-build-top');

    const bottomGeometry = await scroll.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
      const bounds = node.getBoundingClientRect();
      const rows = [...node.querySelectorAll('.u3-build-upgrade')];
      const last = rows.at(-1).getBoundingClientRect();
      return {
        scrollTop: node.scrollTop,
        maxScrollTop: node.scrollHeight - node.clientHeight,
        lastRowVisible: last.top >= bounds.top - 1 && last.bottom <= bounds.bottom + 1
      };
    });
    assert.ok(Math.abs(bottomGeometry.scrollTop - bottomGeometry.maxScrollTop) <= 1);
    assert.equal(bottomGeometry.lastRowVisible, true);
    const weaponGeometry = await weaponScroll.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
      const bounds = node.getBoundingClientRect();
      const items = [...node.querySelectorAll('.u3-build-weapon')];
      const last = items.at(-1).getBoundingClientRect();
      const contentBoxes = items.map((item) => {
        const box = item.getBoundingClientRect();
        const topInContent = box.top - bounds.top + node.scrollTop;
        return { topInContent, bottomInContent: topInContent + box.height };
      });
      return {
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        scrollTop: node.scrollTop,
        maxScrollTop: node.scrollHeight - node.clientHeight,
        allWeaponsReachable: contentBoxes.every(({ topInContent, bottomInContent }) =>
          topInContent >= -1 && bottomInContent <= node.scrollHeight + 1
        ),
        lastWeaponVisible: last.top >= bounds.top - 1 && last.bottom <= bounds.bottom + 1
      };
    });
    assert.equal(weaponGeometry.allWeaponsReachable, true);
    assert.equal(weaponGeometry.lastWeaponVisible, true);
    await capture(page, 'extra-tesla-build-bottom');
    record('Late Tesla build contains all rows and active field with reachable top/bottom content', {
      expectedNames,
      topGeometry,
      bottomGeometry,
      weaponGeometry
    });
  });

  await withGame(async (page) => {
    await beginMission(page, 'pistol');
    await inScene(page, (scene) => {
      scene.weapons.pistol.cooldownMs = 80;
      scene.weaponMutations.pistolBoomerang = true;
    });
    await showChoices(page, ['attackSpeed', 'pistolBoomerang', 'damage']);
    const cards = page.locator('.u3-upgrade-card');
    const text = await page.locator('[data-scp-u3="upgrade"]').innerText();
    assert.equal(await cards.nth(0).isDisabled(), true);
    assert.equal(await cards.nth(1).isDisabled(), true);
    assert.equal(await cards.nth(2).isDisabled(), false);
    assert.match(text, /80\s*→\s*80\s*ms/);
    assert.match(text, /已达上限/);
    assert.match(text, /已激活/);
    assert.match(text, /本局仅一次\s*·\s*不可撤销/);
    await capture(page, 'extra-rifle-capped-and-mutation');
    record('Rifle 80 ms cap and already-used mutation are unavailable', {
      disabled: await cards.evaluateAll((nodes) => nodes.map((node) => node.disabled)),
      status: ['80 ms cap', 'mutation active and irreversible this run']
    });

    await dismissUpgrade(page);
    const longDescription = '当前武器伤害提升百分之二十，并依据现场授权记录重新校准弹道参数；该测试说明用于确认超长中文内容会自然换行，且不会遮挡真实前后数值、卡片边界或底部操作按钮。';
    await showChoices(page, ['damage', 'maxHealth', 'attackSpeed'], {
      clones: { damage: { description: longDescription } }
    });
    const longCard = page.locator('.u3-upgrade-card').first();
    const longGeometry = await longCard.evaluate((card) => {
      const description = card.querySelector('.u3-upgrade-description');
      const comparisons = card.querySelector('.u3-upgrade-comparisons');
      const footer = card.closest('.u3-panel').querySelector('.u3-upgrade-footer');
      const box = (node) => {
        const value = node.getBoundingClientRect();
        return { top: value.top, right: value.right, bottom: value.bottom, left: value.left, width: value.width, height: value.height };
      };
      const descriptionBox = box(description);
      const comparisonBox = box(comparisons);
      const cardBox = box(card);
      const footerBox = box(footer);
      const lineHeight = Number.parseFloat(getComputedStyle(description).lineHeight);
      return {
        description: {
          ...descriptionBox,
          clientHeight: description.clientHeight,
          scrollHeight: description.scrollHeight,
          lineHeight,
          approximateLines: descriptionBox.height / lineHeight,
          whiteSpace: getComputedStyle(description).whiteSpace
        },
        comparison: comparisonBox,
        card: cardBox,
        footer: footerBox,
        descriptionBeforeComparison: descriptionBox.bottom <= comparisonBox.top + 1,
        comparisonInsideCard: comparisonBox.bottom <= cardBox.bottom + 1,
        cardBeforeFooter: cardBox.bottom <= footerBox.top + 1
      };
    });
    await capture(page, 'extra-upgrade-long-description');
    const longIssues = [];
    if (longGeometry.description.approximateLines < 4) longIssues.push('description did not wrap to four lines');
    if (longGeometry.description.scrollHeight > longGeometry.description.clientHeight + 1) longIssues.push('description content is clipped');
    if (!longGeometry.descriptionBeforeComparison) longIssues.push('description overlaps comparison values');
    if (!longGeometry.comparisonInsideCard) longIssues.push('comparison values leave card bounds');
    if (!longGeometry.cardBeforeFooter) longIssues.push('card overlaps footer buttons');
    if (!(await longCard.innerText()).includes(longDescription)) longIssues.push('cloned description was not rendered in the card DOM');
    const originalDescription = await page.evaluate(async () => {
      const { UPGRADE_DEFINITIONS } = await import('/src/config/upgrades.js');
      return UPGRADE_DEFINITIONS.find(({ key }) => key === 'damage').description;
    });
    if (originalDescription !== '当前武器伤害提升 20%。') longIssues.push('source upgrade config description was mutated');
    report.checks.push({
      name: 'Long cloned Chinese description wraps without covering values or buttons',
      passed: longIssues.length === 0,
      detail: {
        configMutation: originalDescription !== '当前武器伤害提升 20%。',
        characterCount: longDescription.length,
        issues: longIssues,
        geometry: longGeometry
      }
    });
    console.log(`${longIssues.length === 0 ? 'PASS' : 'FAIL'} Long cloned Chinese description wraps without covering values or buttons`);
  });

  assert.deepEqual(report.errors, []);
  report.passed = report.checks.every(({ passed }) => passed);
  if (!report.passed) {
    report.failure = `${report.checks.filter(({ passed }) => !passed).length} visual state check(s) failed`;
    process.exitCode = 1;
  }
} catch (error) {
  report.passed = false;
  report.failure = String(error.stack ?? error);
  throw error;
} finally {
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'extra-state-results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
