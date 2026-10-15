// scenes.mjs — scene stack (push/pop/replace) + UI-state layer.
// Scenes: boot/title/intro/overworld/battle. UI panels swap without scene reloads.

export class SceneStack {
  constructor(game) {
    this.game = game;
    this.stack = [];
  }
  get top() { return this.stack[this.stack.length - 1]; }
  push(scene) {
    const cur = this.top;
    if (cur && cur.suspend) cur.suspend();
    this.stack.push(scene);
    scene.game = this.game;
    if (scene.enter) scene.enter();
  }
  pop() {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    const cur = this.top;
    if (cur && cur.resume) cur.resume();
    return s;
  }
  replace(scene) {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    this.stack.push(scene);
    scene.game = this.game;
    if (scene.enter) scene.enter();
  }
  clear() {
    while (this.stack.length) this.pop();
  }
  update(dt) { const t = this.top; if (t && t.update) t.update(dt); }
  render(r, alpha) { const t = this.top; if (t && t.render) t.render(r, alpha); }
}
