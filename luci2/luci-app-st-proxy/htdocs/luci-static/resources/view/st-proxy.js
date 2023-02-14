'use strict';
'require view';
'require ui';
'require form';
'require tools.widgets as widgets';
'require fs';
'require uci';

function setParams(o, params) {
	if (!params) return;
	for (var key in params) {
		var val = params[key];
		if (key === 'values') {
			for (var j = 0; j < val.length; j++) {
				var args = val[j];
				if (!Array.isArray(args))
					args = [args];
				o.value.apply(o, args);
			}
		} else if (key === 'depends') {
			if (!Array.isArray(val))
				val = [val];
			for (var j = 0; j < val.length; j++) {
				var args = val[j];
				if (!Array.isArray(args))
					args = [args];
				o.depends.apply(o, args);
			}
		} else {
			o[key] = params[key];
		}
	}
	if (params['datatype'] === 'bool') {
		o.enabled = '1';
		o.disabled = '0';
	}
}

function defFields(s, opts) {
	s.anonymous = true;
	for (var i = 0; i < opts.length; i++) {
		var opt = opts[i];
		var name = opt[1];
		if (opt[4]['subPath'] != undefined) {
			name = opt[4]['subPath'] + "_" + name;
		}
		var o = s.option(opt[0], name, opt[2], opt[3]);
		setParams(o, opt[4]);
	}
}

function initUCIFromJson(name, stype, json, fields) {
	let sid = uci.add(name, stype)
	fields.forEach((item) => {
		let name = item[1];
		let value = json[item[1]];
		if (item[4]['subPath'] != undefined) {
			name = item[4]['subPath'] + "_" + name;
			value = json[item[4]['subPath']][item[1]];
		}
		uci.set("st-proxy", sid, name, value)
	})
}

function initJsonFromUCI(sname, stype, json, fields) {
	let result = getJsonFromUCIByType(sname, stype, fields)
	fields.forEach((field) => {
		let key = field[1];
		let pKey = field[4]['subPath'];
		if (pKey != undefined) {
			json[pKey][key] = result[pKey][key]
		} else {
			json[key] = result[key]
		}
	})
}

function getJsonFromUCIByType(sname, stype, fields) {
	let json = {};
	fields.forEach((field) => {
		let key = field[1];
		let pKey = field[4]['subPath'];
		if (pKey != undefined) {
			if (json[pKey] == undefined) {
				json[pKey] = {}
			}
			json[pKey][key] = uci.get_first(sname, stype, pKey + "_" + key)
		} else {
			json[key] = uci.get_first(sname, stype, key)
		}
		typeFormat(json, field)
	})
	return json;
}


function getJsonFromUCIById(sname, sid, fields) {
	let json = {};
	fields.forEach((field) => {
		let key = field[1];
		let pKey = field[4]['subPath'];
		if (pKey != undefined) {
			json[pKey][key] = uci.get(sname, sid, pKey + "_" + key)
		} else {
			json[key] = uci.get(sname, sid, key)
		}
		typeFormat(json, field)
	})
	return json;
}
function initUCIFromJsonArray(name, stype, jsonArray, fields) {
	jsonArray.forEach((server, index) => {
		let sid = stype + "_" + index;
		uci.add(name, stype, sid)
		fields.forEach((item) => {
			uci.set(name, sid, item[1], server[item[1]])
		})
	})
}

function initJsonArrayFromUCI(name, stype, jsonArray, fields) {
	jsonArray.splice(0, jsonArray.length);
	getJsonArrayFromUCI(name, stype, fields).forEach(item => {
		jsonArray.push(item)
	})
}

function getJsonArrayFromUCI(name, stype, fields) {
	let result = []
	uci.sections(name, stype).forEach((server) => {
		let serverJson = {};
		fields.forEach((field) => {
			serverJson[field[1]] = uci.get(name, server[".name"], field[1])
			typeFormat(serverJson, field)
		})
		result.push(serverJson)
	})
	console.log(result)
	return result;
}


function typeFormat(obj, field) {
	let name = field[1];
	if (field[4]['subPath'] != undefined) {
		obj = obj[field[4]['subPath']];
	}
	if (field[4].datatype == 'uinteger') {
		obj[name] = parseInt(obj[name])
	} else if (field[4].datatype == 'bool') {
		obj[name] = obj[name] === '1'
	}
}


//	[Widget, Option, Title, Description, {Param: 'Value'}],
var basicFields = [
	[form.Flag, 'enabled', _('开启'), null, { datatype: 'bool' }],
	[form.Flag, 'only_proxy_http', _('仅代理HTTP'), null, { datatype: 'bool' }],
	[form.Value, 'ip', _('绑定地址'), null, { datatype: 'ipaddr', readonly: true }],
	[form.Value, 'port', _('绑定端口'), null, { datatype: 'port', readonly: true }],
	[form.Value, 'so_timeout', _('传输超时(ms)'), null, { datatype: 'uinteger' }],
	[form.Value, 'connect_timeout', _('链接超时(ms)'), null, { datatype: 'uinteger' }],
	[form.Value, 'parallel', _('IO线程数'), null, { datatype: 'uinteger' }],
	[form.Value, 'dns', _('DNS服务器'), _('指定域名解析用的服务器，建议设为ST-DNS'), { datatype: 'ipaddr' }],
	[form.DynamicList, 'whitelist', _('白名单'), _('白名单内的ip和域名均不会被代理'), {}]
];
var tunnelField = [
	[form.ListValue, 'type', _('隧道类型'), _('隧道类型，目前支持直连和SOCKS5'), { values: ['SOCKS', 'DIRECT'], width: 120 }],
	[form.Value, 'ip', _('IP'), null, { datatype: 'ipaddr', width: 120 }],
	[form.Value, 'port', _('端口'), null, { datatype: 'port', width: 60 }],
	[form.Value, 'area', _('隧道地区'), _('隧道地区，支持填写CN/JP/US等2位地区码'), { width: 150 }],
	[form.DynamicList, 'whitelist', _('域名白名单'), _('域名白名单，此白名单域名优先使用此隧道'), {}],
	[form.DynamicList, 'proxy_areas', _('代理地区'), _('此隧道代理地区，支持填写CN/JP/US等2位地区码(隧道地区默认会被代理)'), {}]

];
var logFields = [
	[form.Value, 'level', _('日志级别'), _('0-4, DEBUG/INFO/WARN/ERROR'), { datatype: 'uinteger' }],
	[form.Value, 'ip', _('日志服务器IP'), null, { datatype: 'ipaddr', subPath: 'raw_log_server' }],
	[form.Value, 'port', _('日志服务器端口'), null, { datatype: 'port', subPath: 'raw_log_server' }],
	[form.Value, 'ip', _('APM日志服务器IP'), null, { datatype: 'ipaddr', subPath: 'apm_log_server' }],
	[form.Value, 'port', _('APM日志服务器端口'), null, { datatype: 'port', subPath: 'apm_log_server' }]
];


function getServerId(server) {
	return server['ip'].replaceAll('.', "_") + "_" + server.port;
}
const json_config_file = "/etc/st/proxy/config.json"

return view.extend({
	config: null,
	whitelists: {},
	load: function () {
		return fs.read_direct(json_config_file, 'json').then((data) => {
			this.config = data;
			fs.write("/etc/config/st-proxy", "");
			initUCIFromJson("st-proxy", "basic", data, basicFields)
			initUCIFromJsonArray("st-proxy", "tunnel", data['tunnels'], tunnelField)
			initUCIFromJson("st-proxy", "log", data['log'], logFields)
			uci.save()
			return uci.apply();
		})
	},
	render: function () {
		let rform = new form.Map("st-proxy", 'ST-PROXY控制台');
		let root = rform.section(form.TypedSection, "basic");
		root.anonymous = true;
		root.tab('basicTab', _('基础配置'));
		root.tab('tunnelTab', _('隧道配置'));
		root.tab('logTab', _('日志配置'));

		//基础配置
		let tab = root.taboption('basicTab', form.SectionValue, 'basicTab', form.TypedSection, "basic").subsection
		defFields(tab, basicFields);

		//tunnels配置
		tab = root.taboption('tunnelTab', form.SectionValue, 'tunnelTab', form.TableSection, 'tunnel').subsection
		tab.addremove = true;
		tab.anonymous = true;
		tab.sortable = true;
		tab.nodescriptions = false
		defFields(tab, tunnelField);

		//日志配置
		tab = root.taboption('logTab', form.SectionValue, 'logTab', form.TypedSection, 'log', _('日志配置')).subsection;
		defFields(tab, logFields);

		return rform.render().then((document) => {
			document.querySelectorAll("#cbi-st-proxy-tunnel .cbi-section-table-row").forEach(row => {
				if (row.querySelector("select").value == 'DIRECT') {
					row.querySelectorAll(".cbi-value-field").forEach(fieldDom => {
						let name = fieldDom.getAttribute("data-name");
						if (name == 'ip' || name == 'port') {
							fieldDom.querySelectorAll(".cbi-input-text").forEach(textInput => {
								textInput.disabled = true;
							})
						}
					})

				}
			});
			document.querySelectorAll(".cbi-dynlist").forEach(item => {
				item.style.minWidth = "60px"
			});
			return document;
		})
	},
	handleSaveApply: function (ev) {
		let config = this.config;
		return this.handleSave(ev).then(function () {
			initJsonFromUCI("st-proxy", "basic", config, basicFields);
			initJsonArrayFromUCI("st-proxy", "tunnel", config['tunnels'], tunnelField);
			initJsonFromUCI("st-proxy", "log", config['log'], logFields);

			let enabled = config['enabled'];
			console.log(JSON.stringify(config, null, 2))
			fs.write(json_config_file, JSON.stringify(config, null, 2));
			let conmmand = 'restart'
			if (!enabled) {
				conmmand = 'stop'
			}
			return fs.exec_direct("/etc/init.d/st-proxy", [conmmand]).then(result => {
				ui.changes.apply()
			})
		});
	},
});
