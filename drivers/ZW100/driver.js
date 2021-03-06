'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');
const tamperCancellation = {};

// https://aeotec.freshdesk.com/helpdesk/attachments/6028954764

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		measure_battery: {
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: report => {
				if (report['Battery Level'] === 'battery low warning') return 1;
				if (report.hasOwnProperty('Battery Level (Raw)')) return report['Battery Level (Raw)'][0];
				return null;
			},
		},
		alarm_motion: {
			command_class: 'COMMAND_CLASS_SENSOR_BINARY',
			command_get: 'SENSOR_BINARY_GET',
			command_report: 'SENSOR_BINARY_REPORT',
			command_report_parser: report => {
				if (report && report.hasOwnProperty('Sensor Value')) return report['Sensor Value'] === 'detected an event';
				return null;
			},
		},
		alarm_tamper: {
			command_class: 'COMMAND_CLASS_NOTIFICATION',
			command_get: 'NOTIFICATION_GET',
			command_get_parser: node => {
				if (node && node.hasOwnProperty('state') && typeof node.state.alarm_tamper === 'undefined') {
					node.state.alarm_tamper = false;
				}
				return null;
			},
			command_report: 'NOTIFICATION_REPORT',
			command_report_parser: (report, node) => {
				if (report && report.hasOwnProperty('Notification Type') && report['Notification Type'] === 'Burglar' && report.hasOwnProperty('Event')) {
					// If there are multiple events you want to say "true" to
					if (report['Event'] === 3) {
						if (node) {
							if (tamperCancellation.hasOwnProperty(node.device_data.token) && tamperCancellation[node.device_data.token]) {
								clearTimeout(tamperCancellation[node.device_data.token]);
								tamperCancellation[node.device_data.token] = null;
							}
							if (node.settings.hasOwnProperty('tamper_cancellation') && node.settings.tamper_cancellation > 0) {
								if (!tamperCancellation.hasOwnProperty('node.device_data.token')) tamperCancellation[node.device_data.token];
								tamperCancellation[node.device_data.token] = setTimeout(() => {
									node.state.alarm_tamper = false;
									module.exports.realtime(node.device_data, 'alarm_tamper', false);
								}, node.settings.tamper_cancellation * 1000);
							}
						}
						return true;
					}
					return null;
				}
				return null;
			},
		},
		measure_temperature: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				'Properties1': {
					'Scale': 0,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
					if (report['Sensor Type'] === 'Temperature (version 1)') return report['Sensor Value (Parsed)'];
				}
				return null;
			},
		},
		measure_luminance: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Luminance (version 1)',
				'Properties1': {
					'Scale': 1,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
					if (report['Sensor Type'] === 'Luminance (version 1)') return report['Sensor Value (Parsed)'];
				}
				return null;
			}
		},
		measure_humidity: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Relative humidity (version 2)',
				'Properties1': {
					'Scale': 0,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
					if (report['Sensor Type'] === 'Relative humidity (version 2)') return report['Sensor Value (Parsed)'];
				}
				return null;
			},
		},
		measure_ultraviolet: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Ultraviolet (v5)',
				'Properties1': {
					'Scale': 0,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
					if (report['Sensor Type'] === 'Ultraviolet (v5)') return report['Sensor Value (Parsed)'];
				}
				return null;
			},
		},
	},
	settings: {
		2: {
			index: 2,
			size: 1,
		},
		4: {
			index: 4,
			size: 1,
		},
		3: {
			index: 3,
			size: 2,
		},
		39: {
			index: 39,
			size: 1,
		},
		40: {
			index: 40,
			size: 1,
		},
		41: {
			index: 41,
			size: 2,
			parser: value => new Buffer([Math.round(value * 10), 1]),
		},
		42: {
			index: 42,
			size: 1,
		},
		43: {
			index: 43,
			size: 2,
		},
		44: {
			index: 44,
			size: 1,
		},
		45: {
			index: 45,
			size: 1,
		},
		81: {
			index: 81,
			size: 1,
		},
		111: {
			index: 111,
			size: 4,
		},
		201: {
			index: 201,
			size: 2,
			parser: value => new Buffer([Math.round(value * 10), 1]),
		},
		202: {
			index: 202,
			size: 1,
		},
		203: {
			index: 203,
			size: 2,
		},
		204: {
			index: 204,
			size: 1,
		},
		tamper_cancellation: (newValue, oldValue, deviceData) => {
			if (tamperCancellation.hasOwnProperty(deviceData.token) && tamperCancellation[deviceData.token]) {
				clearTimeout(tamperCancellation[deviceData.token]);
				tamperCancellation[deviceData.token] = null;
				const node = module.exports.nodes[deviceData.token];
				if (node) {
					if (node.state.alarm_tamper) module.exports.realtime(deviceData, 'alarm_tamper', false);
					node.state.alarm_tamper = false;
				}
			}
		},
	},
});
