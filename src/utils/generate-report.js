const report = require('multiple-cucumber-html-reporter');

report.generate({
    jsonDir: 'test-results',
    reportPath: './playwright-report/cucumber-report',
    metadata: {
        browser: {
            name: 'chromium',
            version: '118'
        },
        device: 'GitHub Actions - Ubuntu',
        platform: {
            name: 'ubuntu',
            version: '22.04'
        }
    },
    customData: {
        title: 'Test Execution Info',
        data: [
            { label: 'Project', value: 'NinjaOne Automation' },
            { label: 'Release', value: '1.0.0' },
            { label: 'Execution Start Time', value: new Date().toISOString() },
            { label: 'Execution End Time', value: new Date().toISOString() }
        ]
    },
    displayDuration: true,
    durationInMS: true,
    displayReportTime: true,
    disableLog: false,
    pageTitle: 'NinjaOne Test Automation Report',
    reportName: 'NinjaOne Test Automation Report',
    pageFooter: '<div class="created-by">Created by Test Automation Team</div>'
}); 