import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: './TelloNode.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        exports: 'default',
        sourcemap: true
    },
    plugins: [
        nodeResolve(),
        typescript({
            compilerOptions: { module: 'CommonJS' },
            outDir: 'dist'
        }),
        commonjs({
            extensions: ['.js', '.ts']
        })
    ],
};