'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGBS-321/FGBS-321-EN-A-v1.01.pdf

module.exports = new ZwaveDriver( path.basename(__dirname), {
	debug: true,
	capabilities: {
		'alarm_generic.contact1': [
			{
				'multiChannelNodeId': 1,
				'command_class': 'COMMAND_CLASS_SENSOR_BINARY',
				'command_get': 'SENSOR_BINARY_GET',
				'command_report': 'SENSOR_BINARY_REPORT',
				'command_report_parser': report => report['Sensor Value'] === 'detected an event'
			},
			{
				'command_class': 'COMMAND_CLASS_SCENE_ACTIVATION',
				'command_report': 'SCENE_ACTIVATION_SET',
				'command_report_parser': report => {
					if (report['Scene ID'] === 10)
						return true;
					
					if (report['Scene ID'] === 11)
						return false;
				}
			}
		],
			
		'alarm_generic.contact2': [
			{
				'multiChannelNodeId': 2,
				'command_class': 'COMMAND_CLASS_SENSOR_BINARY',
				'command_get': 'SENSOR_BINARY_GET',
				'command_report': 'SENSOR_BINARY_REPORT',
				'command_report_parser': report => report['Sensor Value'] === 'detected an event'
			},
			{
				'command_class': 'COMMAND_CLASS_SCENE_ACTIVATION',
				'command_report': 'SCENE_ACTIVATION_SET',
				'command_report_parser': report => {
					if (report['Scene ID'] === 20)
						return true;
					
					if (report['Scene ID'] === 21)
						return false;
				}
			}
		],
		
		'measure_temperature.sensor1': {
			'multiChannelNodeId': 3,
			'command_class': 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get': 'SENSOR_MULTILEVEL_GET',
			'command_get_parser': () => {
				return {
					'Sensor Type': 'Temperature (version 1)',
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report': 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser': report => {
				if (report['Sensor Type'] === 'Temperature (version 1)')
					return report['Sensor Value (Parsed)'];
				
				return null;
			},
			'optional': true
		},
		
		'measure_temperature.sensor2': {
			'multiChannelNodeId': 4,
			'command_class': 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get': 'SENSOR_MULTILEVEL_GET',
			'command_get_parser': () => {
				return {
					'Sensor Type': 'Temperature (version 1)',
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report': 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser': report => {
				if (report['Sensor Type'] === 'Temperature (version 1)')
					return report['Sensor Value (Parsed)'];
				
				return null;
			},
			'optional': true
		},
		
		'measure_temperature.sensor3': {
			'multiChannelNodeId': 5,
			'command_class': 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get': 'SENSOR_MULTILEVEL_GET',
			'command_get_parser': () => {
				return {
					'Sensor Type': 'Temperature (version 1)',
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report': 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser': report => {
				if (report['Sensor Type'] === 'Temperature (version 1)')
					return report['Sensor Value (Parsed)'];
				
				return null;
			},
			'optional': true
		},
		
		'measure_temperature.sensor4': {
			'multiChannelNodeId': 6,
			'command_class': 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get': 'SENSOR_MULTILEVEL_GET',
			'command_get_parser': () => {
				return {
					'Sensor Type': 'Temperature (version 1)',
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report': 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser': report => {
				if (report['Sensor Type'] === 'Temperature (version 1)')
					return report['Sensor Value (Parsed)'];
				
				return null;
			},
			'optional': true
		}
	},
	
	"settings": {
		10: {
			"index": 10,
			"size": 1
		},
		11: {
			"index": 11,
			"size": 1
		},
		12: {
			"index": 12,
			"size": 1,
			"parser": value => Math.round(value / 16 * 255)
		}
	}
});
