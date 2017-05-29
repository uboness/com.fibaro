'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// Documentation: http://manualzilla.com/doc/5840243/user-manual-roller-shutter-fgr-221-v1.1---pepper

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		dim: {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			command_get: 'SWITCH_MULTILEVEL_GET',
			command_set: 'SWITCH_MULTILEVEL_SET',
			command_set_parser: value => ({
				Value: Math.round(value * 99),
				'Dimming Duration': 255,
			}),
			command_report: 'SWITCH_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report && report.hasOwnProperty('Value (Raw)')) {
					if (report['Value (Raw)'][0] === 255) return 1;
					return report['Value (Raw)'][0] / 99;
				}
				return null;
			},
		},
	},
	settings: {
		type_input: {
			index: 14,
			size: 1,
		},
	},
});
