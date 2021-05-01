'use strict';
'require view';
'require ui';
'require form';
'require tools.widgets as widgets';
'require fs';
'require uci';
//	[Widget, Option, Title, Description, {Param: 'Value'}],
var basicFields = [
	[form.Flag, 'enabled', _('开启'), null, { datatype: 'bool' }],
	[form.Value, 'ip', _('绑定地址'), _('ServerAddr specifies the address of the server to connect to.<br>By default, this value is "0.0.0.0".'), { datatype: 'ipaddr' }],
	[form.Value, 'port', _('绑定端口'), _('ServerPort specifies the port to connect to the server on.<br>By default, this value is 7000.'), { datatype: 'port' }],
	[form.Value, 'dns_cache_expire', _('过期时间(秒)'), _('DNS记录过期时间，默认10分钟'), { datatype: 'uinteger' }],
];
var dnsServerFields = [
	[form.ListValue, 'type', _('DNS协议类型'), null, { values: ['UDP', 'TCP', 'TCP_SSL'] }],
	[form.Value, 'ip', _('IP'), null, { datatype: 'ipaddr' }],
	[form.Value, 'port', _('端口'), null, { datatype: 'port' }],
	[form.Value, 'dns_cache_expire', _('过期时间'), null, { datatype: 'uinteger' }],
	[form.Value, 'area', _('地区'), null, {}],
	[form.Flag, 'only_area_ip', '限定地区', null, { datatype: 'bool' }],
	[form.Value, 'timeout', _('超时时间(ms)'), null, { datatype: 'uinteger' }],

];
var logFields = [
	[form.Value, 'level', _('日志级别'), _('0-4, DEBUG/INFO/WARN/ERROR'), { datatype: 'uinteger' }],
	[form.Value, 'ip', _('日志服务器IP'), null, { datatype: 'ipaddr', subPath: 'raw_log_server' }],
	[form.Value, 'port', _('日志服务器端口'), null, { datatype: 'port', subPath: 'raw_log_server' }],
	[form.Value, 'ip', _('APM日志服务器IP'), null, { datatype: 'ipaddr', subPath: 'apm_log_server' }],
	[form.Value, 'port', _('APM日志服务器端口'), null, { datatype: 'port', subPath: 'apm_log_server' }]
];
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
function getServerId(server) {
	return server['ip'].replaceAll('.', "_") + "_" + server.port;
}
const json_config_file = "/etc/st/dns/config.json"

function onEditWhitelist(param) {
	let sid = param.path[3].getAttribute("data-section-id");
	let server = getJsonFromUCIById("st-dns", sid, dnsServerFields);
	let serverId = getServerId(server);
	let inputId = serverId + "_whitelist";
	let filePath = "/etc/st/dns/whitelist/" + serverId;
	L.resolveDefault(fs.read_direct(filePath, 'text'), '').then((fileData) => {
		L.ui.showModal(_('域名白名单(' + serverId + ')'), [
			E('div', { 'class': 'left', 'style': 'display:flex; flex-direction:column' }, [
				E('label', { 'class': 'cbi-input-text', 'style': 'padding-top:.5em' }, [
					E('textarea', { 'style': 'width:100%;resize: none', 'id': inputId }, [
						fileData
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': L.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': ui.createHandlerFn(this, function (ev) {
						fs.write(filePath, document.getElementById(inputId).value);
						L.hideModal();
					})
				}, _('保存'))
			])
		]);
	});

};
return view.extend({
	config: null,
	load: function () {
		return fs.read_direct(json_config_file, 'json').then((data) => {
			this.config = data;
			fs.write("/etc/config/st-dns", "");
			initUCIFromJson("st-dns", "basic", data, basicFields)
			initUCIFromJsonArray("st-dns", "server", data['servers'], dnsServerFields)
			initUCIFromJson("st-dns", "log", data['log'], logFields)
			uci.save()
			return uci.apply();
		})
	},
	render: function () {
		let rform = new form.Map("st-dns", 'ST-DNS控制台');
		let root = rform.section(form.TypedSection, "basic");
		root.anonymous = true;
		root.tab('basicTab', _('基础配置'));
		root.tab('serverTab', _('DNS服务器'));
		root.tab('logTab', _('日志配置'));

		//基础配置
		let tab = root.taboption('basicTab', form.SectionValue, 'basicTab', form.TypedSection, "basic").subsection
		defFields(tab, basicFields);

		//DNS服务器配置
		tab = root.taboption('serverTab', form.SectionValue, 'serverTab', form.TableSection, 'server').subsection
		tab.addremove = true;
		tab.anonymous = true;
		tab.sortable = true;
		tab.nodescriptions = true
		tab.extedit = onEditWhitelist
		defFields(tab, dnsServerFields);

		//日志配置
		tab = root.taboption('logTab', form.SectionValue, 'logTab', form.TypedSection, 'log', _('日志配置')).subsection;
		defFields(tab, logFields);

		return rform.render().then((document) => {
			document.querySelectorAll("#cbi-st-dns-server .cbi-button-edit").forEach(btn => {
				btn.innerHTML = '编辑白名单'
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

			let enabled = config['enabled'];
			console.log(JSON.stringify(config, null, 2))
			fs.write(json_config_file, JSON.stringify(config, null, 2));
			let conmmand = 'restart'
			if (!enabled) {
				conmmand = 'stop'
			}
			return fs.exec_direct("/etc/init.d/st-dns", [conmmand]).then(result => {
				ui.changes.apply()
			})
		});
	},
});
