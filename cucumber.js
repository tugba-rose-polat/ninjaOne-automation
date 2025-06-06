module.exports = {
    default: {
        paths: ['src/test/features/*.feature'],
        require: ['src/test/steps/*.ts'],
        requireModule: ['ts-node/register'],
        format: [
            '@cucumber/pretty-formatter',
            'progress-bar',
            'html:cucumber-report.html'
        ],
        parallel: 1,
        publishQuiet: true,
        worldParameters: {
            browserOptions: {
                headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'
            }
        }
    }
}; 