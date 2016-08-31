"use strict";

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/492

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		windowcoverings_state: {
			command_class: 'COMMAND_CLASS_SWITCH_BINARY',
			command_get: 'SWITCH_BINARY_GET',
			command_set: 'SWITCH_BINARY_SET',
			command_set_parser: (value, node) => {
				let result = 'off/disable';

				// Check correct counter value in case of idle
				if (value === 'idle') {
					if (node.state.position === 'on/enable') result = 'off/disable';
					else if (node.state.position === 'off/disable') result = 'on/enable';
				} else if (value === 'up') {
					result = 'on/enable';
				}

				// Save latest known position state
				if (node && node.state) {
					node.state.position = result;
				}

				return {
					'Switch Value': result
				};
			},
			command_report: 'SWITCH_BINARY_REPORT',
			command_report_parser: (report, node) => {

				// Save latest known position state
				if (node && node.state) {
					node.state.position = report['Value']
				}

				switch (report['Value']) {
					case 'on/enable':
						return 'up';
					case 'off/disable':
						return 'down';
					default:
						return 'idle'
				}
			}
		},
		measure_power: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				return report['Sensor Value (Parsed)'];
			}
		}
	},
	settings: {
		'reports_type': {
			index: 3,
			size: 1,
			parser: input => new Buffer([Number(input)])
		},
		'operating_mode': {
			index: 10,
			size: 1,
			parser: input => new Buffer([Number(input)])
		},
		'switch_type': {
			index: 14,
			size: 1,
			parser: input => new Buffer([Number(input)])
		},
		'power_level_change': {
			index: 40,
			size: 1
		},
		'periodic_power_level_reports': {
			index: 42,
			size: 2
		},
		'start_calibration': {
			index: 29,
			size: 1,
			parser: input => new Buffer([Number(input)])
		}
	}
});

module.exports.on('initNode', function (token) {

	var node = module.exports.nodes[token];
	if (node) {
		node.instance.CommandClass['COMMAND_CLASS_SWITCH_BINARY'].on('report', function (command, report) {

		});
	}
});
