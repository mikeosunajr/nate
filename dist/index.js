// binaryen.js
import binaryen from "https://cdn.jsdelivr.net/npm/binaryen@105.0.0/index.min.js";
var binaryen_default = binaryen;

// src/core.ts
var AddWord = class {
  constructor() {
    this.kind = 0 /* add */;
    this.inputs = [0 /* number */, 0 /* number */];
    this.outputs = [0 /* number */];
  }
};
var NumberWord = class {
  constructor(n) {
    this.kind = 1 /* number */;
    this.inputs = [];
    this.outputs = [0 /* number */];
    this.number = n;
  }
};
function Add() {
  return new AddWord();
}
function Number(n) {
  return new NumberWord(n);
}

// localstorage.js
function LocalStorage() {
  return localStorage;
}

// src/index.ts
if (!localStorage) {
  localStorage = new LocalStorage("./scratch");
}
var memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true
});
function compile(words) {
  var mod = new binaryen_default.Module();
  const stack = [];
  let varId = 0;
  const use = () => {
    if (stack.length < 1) {
      throw new Error("popping empty stack");
    }
    return stack.pop() || 0;
  };
  const genvar = () => {
    stack.push(varId);
    varId += 1;
    return varId - 1;
  };
  const shape = words.reduce((p, w) => {
    w.inputs.forEach((i) => {
      if (p.outputs.length > 0) {
        p.outputs.pop();
      } else {
        p.inputs.push(i);
      }
    });
    w.outputs.forEach((o) => {
      p.outputs.push(o);
      p.locals.push(o);
    });
    return p;
  }, { inputs: [], outputs: [], locals: [] });
  console.log(shape);
  shape.inputs.forEach((p) => {
    genvar();
  });
  const expressions = words.map((word) => {
    switch (word.kind) {
      case 0 /* add */:
        const a = mod.local.get(use(), binaryen_default.i32);
        const b = mod.local.get(use(), binaryen_default.i32);
        return mod.local.set(genvar(), mod.i32.add(a, b));
      case 1 /* number */:
        return mod.local.set(genvar(), mod.i32.const(word.number));
    }
  });
  const varsToBinaryenTypes = (t) => t.map((v) => binaryen_default.i32);
  mod.addFunction("run", binaryen_default.createType(varsToBinaryenTypes(shape.inputs)), binaryen_default.i32, varsToBinaryenTypes(shape.locals), mod.block(null, [
    ...expressions,
    mod.return(mod.local.get(use(), binaryen_default.i32))
  ]));
  mod.addFunctionExport("run", "run");
  mod.addMemoryImport("0", "env", "memory");
  mod.setMemory(1, 256, "memoryExport", [], true);
  mod.setFeatures(binaryen_default.Features.Atomics);
  mod.optimize();
  if (!mod.validate())
    throw new Error("validation error");
  var textData = mod.emitText();
  console.log(textData);
  var wasmData = mod.emitBinary();
  return new WebAssembly.Module(wasmData);
}
var wasm = compile([
  Number(3),
  Number(3),
  Add(),
  Add(),
  Number(3),
  Add()
]);
var instance = new WebAssembly.Instance(wasm, { env: { memory } });
console.log(instance.exports.run(1));
//# sourceMappingURL=index.js.map
