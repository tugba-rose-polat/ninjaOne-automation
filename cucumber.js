module.exports = {
    default: {
        paths: ['src/test/features/*.feature'],
        require: ['src/test/steps/*.ts'],
        requireModule: ['ts-node/register'],
        format: ['progress-bar', 'html:cucumber-report.html'],
        parallel: 1,
        publishQuiet: true
    }
}; 