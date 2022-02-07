import binaryen from "binaryen";
import * as Core from "./core";

// Create a module with a single function
var myModule = new binaryen.Module();

let memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true,
});
const view = new Int32Array(memory.buffer);
view[0] = 3;

const add = myModule.i32.add(
  myModule.local.get(0, binaryen.i32),
  myModule.i32.load(0, 4, myModule.i32.const(0))
);

myModule.addFunction(
  "run",
  binaryen.createType([binaryen.i32]),
  binaryen.i32,
  [binaryen.i32],
  myModule.block(null, [
    myModule.local.set(1, add),
    myModule.return(myModule.local.get(1, binaryen.i32)),
  ])
);

myModule.addFunctionExport("run", "run");
myModule.addMemoryImport("0", "env", "memory");
myModule.setMemory(1, 256, "memoryExport", [], true);
myModule.setFeatures(binaryen.Features.Atomics);

// Optimize the module using default passes and levels
myModule.optimize();

// // // Validate the module
if (!myModule.validate()) throw new Error("validation error");

// // Generate text format and binary
var textData = myModule.emitText();
console.log(textData);
var wasmData = myModule.emitBinary();

// Example usage with the WebAssembly API
var compiled = new WebAssembly.Module(wasmData);
var instance = new WebAssembly.Instance(compiled, { env: { memory } });
console.log((instance.exports.run as CallableFunction)(400));

function compile(params: Core.Type[], words: Core.Word[]) {
  var mod = new binaryen.Module();

  let topOfStack = params.length - 1;
  const decr = () => {
    topOfStack -= 1;
    return topOfStack + 1;
  };
  const incr = () => {
    topOfStack += 1;
    return topOfStack - 1;
  };

  const top = () => topOfStack;

  const expressions = words.map((word) => {
    switch (word.kind) {
      case Core.Kind.add:
        // return add of last 2 values of stack
        return mod.i32.add(
          mod.local.get(decr(), binaryen.i32),
          mod.local.get(decr(), binaryen.i32)
        );
      case Core.Kind.number:
        // Push const value to stack
        incr();
        return mod.local.set(top(), word.number);
    }
  });

  mod.addFunction(
    "run",
    binaryen.createType([binaryen.i32]),
    binaryen.i32,
    [binaryen.i32],
    mod.block(null, [
      mod.local.set(1, add),
      mod.return(myModule.local.get(1, binaryen.i32)),
    ])
  );

  mod.addFunctionExport("run", "run");
  mod.addMemoryImport("0", "env", "memory");
  mod.setMemory(1, 256, "memoryExport", [], true);
  mod.setFeatures(binaryen.Features.Atomics);

  // Optimize the module using default passes and levels
  mod.optimize();

  // // // Validate the module
  if (!mod.validate()) throw new Error("validation error");

  // // Generate text format and binary
  var textData = mod.emitText();
  console.log(textData);
}

const addOne = compile([Core.NumberT()], [Core.Number(1), Core.Add()]);

//addOne(42); // => 43
