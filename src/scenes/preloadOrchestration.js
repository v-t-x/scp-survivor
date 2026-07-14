export function runPreloadCreatePipeline(scene, {
  generateFallbackTextures,
  registerOpeningCharacterAnimations,
  registerEnemyAnimations
}) {
  generateFallbackTextures(scene);
  registerOpeningCharacterAnimations(scene);
  registerEnemyAnimations(scene);
  scene.scene.start("PrototypeScene");
}
