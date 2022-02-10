import binaryen from "binaryen";
import * as Core from "./core";

let memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true,
});

function compile(params: Core.Type[], words: Core.Word[]) {
  var mod = new binaryen.Module();

  const stack: Array<number> = [];
  const vars: Array<Core.Type> = [];

  let varId = 0;
  const use = () => {
    if (stack.length < 1) {
      throw new Error("popping empty stack");
    }
    return stack.pop() || 0;
  };
  const genvar = (t: Core.Type) => {
    stack.push(varId);
    vars.push(t);
    varId += 1;
    return varId - 1;
  };

  params.forEach((p) => {
    genvar(p);
  });

  const expressions = words.map((word) => {
    switch (word.kind) {
      case Core.Kind.add:
        // return add of last 2 values of stack
        const a = mod.local.get(use(), binaryen.i32);
        const b = mod.local.get(use(), binaryen.i32);

        return mod.local.set(genvar(Core.NumberT()), mod.i32.add(a, b));
      case Core.Kind.number:
        // Push const value to stack
        return mod.local.set(
          genvar(Core.NumberT()),
          mod.i32.const(word.number)
        );
    }
  });

  const varsToBinaryenTypes = () => vars.map((v) => binaryen.i32);

  mod.addFunction(
    "run",
    binaryen.createType([binaryen.i32]),
    binaryen.i32,
    varsToBinaryenTypes(),
    mod.block(null, [
      ...expressions,
      mod.return(mod.local.get(use(), binaryen.i32)),
    ])
  );

  mod.addFunctionExport("run", "run");
  mod.addMemoryImport("0", "env", "memory");
  mod.setMemory(1, 256, "memoryExport", [], true);
  mod.setFeatures(binaryen.Features.Atomics);

  // Optimize the module using default passes and levels
  //mod.optimize();

  // // // Validate the module
  if (!mod.validate()) throw new Error("validation error");

  // // Generate text format and binary
  var textData = mod.emitText();
  console.log(textData);
  var wasmData = mod.emitBinary();

  // Example usage with the WebAssembly API
  return new WebAssembly.Module(wasmData);
}

const wasm = compile(
  [Core.NumberT()],
  [
    Core.Number(3),
    Core.Number(3),
    Core.Add(),
    Core.Add(),
    Core.Number(3),
    Core.Add(),
  ]
);

var instance = new WebAssembly.Instance(wasm, { env: { memory } });
console.log((instance.exports.run as CallableFunction)(1));

//addOne(42); // => 43
