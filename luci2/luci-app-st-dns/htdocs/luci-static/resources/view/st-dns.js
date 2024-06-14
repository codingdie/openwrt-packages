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
		uci.set("st-dns", sid, name, value)
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
	[form.Value, 'ip', _('绑定地址'), null, { readonly: true, datatype: 'ipaddr' }],
	[form.Value, 'port', _('绑定端口'), null, { readonly: true, datatype: 'port' }],
	[form.Value, 'dns_cache_expire', _('过期时间(秒)'), _('DNS记录过期时间，默认10分钟'), { datatype: 'uinteger' }],
	[form.Flag, 'area_resolve_optimize', _('解析自适应优化'), _('必需安装运行st-proxy才能开启此选项'), { datatype: 'bool' }],
];
var dnsServerFields = [
	[form.ListValue, 'type', _('协议类型'), _('DNS协议类型'), { values: ['UDP', 'TCP', 'TCP_SSL'], width: 100 }],
	[form.Value, 'ip', _('IP'), null, { datatype: 'ipaddr', width: 120 }],
	[form.Value, 'port', _('端口'), null, { datatype: 'port', width: 60 }],
	[form.Value, 'dns_cache_expire', _('缓存时间(s)'), null, { datatype: 'uinteger', width: 60 }],
	[form.Value, 'timeout', _('解析超时(ms)'), null, { datatype: 'uinteger', width: 70 }],
	[form.DynamicList, 'areas', _('地区'), _('此服务器负责解析的地区，支持填写CN/JP/US等2位地区码'), {}],
	[form.DynamicList, 'whitelist', _('白名单'), _('此白名单的域名强制被此服务器解析'), {}]

];
var logFields = [
	[form.Value, 'level', _('日志级别'), _('0-4, DEBUG/INFO/WARN/ERROR'), { datatype: 'uinteger' }]
];
var ipAreaFields = [
	[form.Value, 'url', _('接口URL'), null, {}],
	[form.Value, 'area_json_path', _('地区码JsonPath'), null, {}]
];
function getServerId(server) {
	return server['ip'].replaceAll('.', "_") + "_" + server.port;
}
const json_config_file = "/etc/st/dns/config.json"
return view.extend({
	config: null,
	load: function () {
		return fs.read_direct(json_config_file, 'json').then((data) => {
			if (data['area_ip_config'] == undefined) {
				data['area_ip_config'] = {}
				data['area_ip_config']['interfaces'] = []
			}
			console.log(data)

			this.config = data;
			fs.write("/etc/config/st-dns", "");
			initUCIFromJson("st-dns", "basic", data, basicFields)
			initUCIFromJsonArray("st-dns", "server", data['servers'], dnsServerFields)
			initUCIFromJson("st-dns", "log", data['log'], logFields)
			initUCIFromJsonArray("st-dns", "area_ip_config", data['area_ip_config']['interfaces'], ipAreaFields)

			return uci.save().then(() => {
				return uci.apply().then(() => {
					return uci.load("dhcp")
				});
			})
		})
	},
	render: function () {
		let rform = new form.Map("st-dns", 'ST-DNS控制台');
		let root = rform.section(form.TypedSection, "basic");
		root.anonymous = true;
		root.tab('basicTab', _('基础配置'));
		root.tab('serverTab', _('DNS服务器'));
		root.tab('logTab', _('日志配置'));
		root.tab('areaIPTab', _('IP库配置'));

		//基础配置
		let tab = root.taboption('basicTab', form.SectionValue, 'basicTab', form.TypedSection, "basic").subsection
		defFields(tab, basicFields);

		//DNS服务器配置
		tab = root.taboption('serverTab', form.SectionValue, 'serverTab', form.TableSection, 'server').subsection
		tab.addremove = true;
		tab.anonymous = true;
		tab.sortable = true;
		defFields(tab, dnsServerFields);

		//日志配置
		tab = root.taboption('logTab', form.SectionValue, 'logTab', form.TypedSection, 'log', _('日志配置')).subsection;
		defFields(tab, logFields);

		//IP库配置
		tab = root.taboption('areaIPTab', form.SectionValue, 'areaIPTab', form.TableSection, 'area_ip_config').subsection
		tab.addremove = true;
		tab.anonymous = true;
		tab.sortable = true;
		defFields(tab, ipAreaFields);
		return rform.render().then((document) => {
			document.querySelectorAll("#cbi-st-dns-server .cbi-button-edit").forEach(btn => {
				btn.innerHTML = '编辑白名单'
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
			initJsonFromUCI("st-dns", "basic", config, basicFields);
			initJsonArrayFromUCI("st-dns", "server", config['servers'], dnsServerFields);
			initJsonFromUCI("st-dns", "log", config['log'], logFields);
			config['area_ip_config'] = {};
			config['area_ip_config']['interfaces'] = []
			initJsonArrayFromUCI("st-dns", "area_ip_config", config['area_ip_config']['interfaces'], ipAreaFields);

			let enabled = config['enabled'];
			console.log(config)

			fs.write(json_config_file, JSON.stringify(config, null, 2));
			fs.write("/etc/config/dnsmasq.servers", "server=" + config['ip']);
			let conmmand = 'restart'
			if (!enabled) {
				conmmand = 'stop'
				uci.unset_first("dhcp", "dnsmasq", "serversfile")
				uci.unset_first("dhcp", "dnsmasq", "cachesize")
				uci.set_first("dhcp", "dnsmasq", "noresolv", "0")
				uci.set_first("dhcp", "dnsmasq", "resolvfile", "/tmp/resolv.conf.auto")
			} else {
				uci.set_first("dhcp", "dnsmasq", "serversfile", "/etc/config/dnsmasq.servers")
				uci.set_first("dhcp", "dnsmasq", "noresolv", "1")
			}
			uci.save().then(result1 => {
				return fs.exec_direct("/etc/init.d/st-dns", [conmmand]).then(result => {
					return fs.exec_direct("/etc/init.d/dnsmasq", ["realod"]);
				}).then(() => {
					ui.changes.apply()
				})
			})
		});
	},
});
