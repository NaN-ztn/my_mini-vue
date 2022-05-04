// runtime-core 不依赖来与 compiler-core
// 反之亦然，避免形成强依赖，vue 可以只存在于运行时，
// 使用一些打包工具可以提前将 template 进行编译，从而缩小上线体积，使得 vue 只需要运行时即可

export * from "./compile";
