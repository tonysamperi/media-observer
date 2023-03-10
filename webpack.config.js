const {join, resolve} = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin;

const locals = {
    IS_DEV: !0,
    PATHS: {
        root: resolve(__dirname)
    }
};

const entry = {
    index: "./src/index.ts",
    page: "./src/test/page.ts"
};

const externals = {};

const plugins = [
    new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false, // resolve conflict with `CopyWebpackPlugin`
    }),
    new CopyPlugin({
        patterns: [
            {from: "./src/test/*.html", to: "./[name][ext]"}
        ]
    })
];

module.exports = {
    // devtool: "eval-source-map",
    devtool: "source-map",
    target: "web",
    devServer: {
        static: {
            directory: join(__dirname, "dist")
        },
        port: 4200,
    },
    entry,
    plugins,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        filename: "[name].js",
        path: resolve(__dirname, "dist")
    },
    externals
};

