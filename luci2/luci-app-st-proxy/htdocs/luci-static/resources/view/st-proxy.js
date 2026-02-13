'use strict';
'require view';
'require ui';
'require form';
'require tools.widgets as widgets';
'require fs';
'require uci';
'require rpc';

var callAnalyseTunnel = rpc.declare({
	object: 'st-proxy',
	method: 'analyse_tunnel',
	expect: { result: '' }
});

var callAnalyseIpTunnels = rpc.declare({
	object: 'st-proxy',
	method: 'analyse_ip_tunnels',
	params: ['ip'],
	expect: { result: '' }
});

var callBlacklist = rpc.declare({
	object: 'st-proxy',
	method: 'blacklist',
	expect: { result: '' }
});

var callSessionList = rpc.declare({
	object: 'st-proxy',
	method: 'session_list',
	expect: { result: '' }
});

var callResolveDomain = rpc.declare({
	object: 'st-proxy',
	method: 'resolve_domain',
	params: ['domain'],
	expect: { result: '' }
});

function parseTabularData(text) {
	if (!text || text.trim() === '') {
		return [];
	}

	var lines = text.trim().split('\n');
	var rows = [];

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		// 跳过 "success" 标志行
		if (line && line !== 'success') {
			var cols = line.split('\t').map(function(col) {
				return col.trim();
			});
			rows.push(cols);
		}
	}

	return rows;
}

function createTable(headers, rows, emptyText) {
	if (!rows || rows.length === 0) {
		return E('div', { 'class': 'cbi-section' }, [
			E('p', {}, emptyText || _('无数据'))
		]);
	}

	var tableRows = rows.map(function(row) {
		return E('tr', { 'class': 'tr' },
			row.map(function(cell) {
				return E('td', { 'class': 'td' }, cell || '-');
			})
		);
	});

	return E('div', { 'class': 'table cbi-section-table' }, [
		E('div', { 'class': 'tr table-titles' },
			headers.map(function(header) {
				return E('div', { 'class': 'th' }, header);
			})
		)
	].concat(tableRows));
}

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
	[form.Value, 'ip', _('绑定地址'), null, { datatype: 'ipaddr', readonly: true }],
	[form.Value, 'port', _('绑定端口'), null, { datatype: 'port', readonly: true }],
	[form.Value, 'so_timeout', _('传输超时(ms)'), null, { datatype: 'uinteger' }],
	[form.Value, 'connect_timeout', _('链接超时(ms)'), null, { datatype: 'uinteger' }],
	[form.Value, 'dns', _('DNS服务器'), _('指定域名解析用的服务器，建议设为ST-DNS'), { datatype: 'ipaddr' }],
	[form.DynamicList, 'proxy_target', _('代理目标'), _('可填值:all/http/dns/IP地址,可多填'), {}],
	[form.DynamicList, 'whitelist', _('代理白名单'), _('白名单内的ip和域名均不会被代理'), {}]

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
];
var ipAreaFields = [
	[form.Value, 'url', _('接口URL'), null, {}],
	[form.Value, 'area_json_path', _('地区码JsonPath'), null, {}]
];

function getServerId(server) {
	return server['ip'].replaceAll('.', "_") + "_" + server.port;
}
const json_config_file = "/etc/st/proxy/config.json"

return view.extend({
	config: null,
	whitelists: {},
	load: function () {
		return Promise.all([
			fs.read_direct(json_config_file, 'json'),
			callAnalyseTunnel(),
			callBlacklist()
		]).then((results) => {
			var data = results[0];
			if (data['area_ip_config'] == undefined) {
				data['area_ip_config'] = {}
				data['area_ip_config']['interfaces'] = []
			}
			console.log(data)
			this.config = data;
			this.tunnelAnalyseData = results[1];
			this.blacklistData = results[2];

			fs.write("/etc/config/st-proxy", "");
			initUCIFromJson("st-proxy", "basic", data, basicFields)
			initUCIFromJsonArray("st-proxy", "tunnel", data['tunnels'], tunnelField)
			initUCIFromJson("st-proxy", "log", data['log'], logFields)
			initUCIFromJsonArray("st-proxy", "area_ip_config", data['area_ip_config']['interfaces'], ipAreaFields)

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
		root.tab('areaIPTab', _('IP库配置'));
		root.tab('analyseTab', _('质量分析'));

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

		//IP库配置
		tab = root.taboption('areaIPTab', form.SectionValue, 'areaIPTab', form.TableSection, 'area_ip_config').subsection
		tab.addremove = true;
		tab.anonymous = true;
		tab.sortable = true;
		defFields(tab, ipAreaFields);

		// 分析 Tab
		var analyseSection = root.taboption('analyseTab', form.DummyValue, '_analyse');
		analyseSection.rawhtml = true;
		analyseSection.render = L.bind(function() {
			var tunnelRows = parseTabularData(this.tunnelAnalyseData);
			var blacklistRows = parseTabularData(this.blacklistData);

			return E('div', { 'class': 'cbi-section' }, [
				// 隧道质量分析区域
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('隧道质量分析')),
					createTable(
						[_('隧道'), _('地区'), _('成功'), _('失败'), _('平均首包耗时'), _('失败IPS'), _('过期时间(分钟)')],
						tunnelRows,
						_('无隧道数据')
					),
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'style': 'margin-top: 10px',
						'click': function() {
							ui.showModal(_('刷新中'), [
								E('p', { 'class': 'spinning' }, _('正在刷新数据...'))
							]);

							callAnalyseTunnel().then(function(result) {
								ui.hideModal();
								window.location.reload();
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', _('刷新失败: %s').format(err.message)), 'error');
							});
						}
					}, _('刷新'))
				]),

				// 黑名单区域
				E('div', { 'class': 'cbi-section', 'style': 'margin-top: 20px' }, [
					E('h3', {}, _('黑名单')),
					createTable(
						[_('IP'), _('域名')],
						blacklistRows,
						_('黑名单为空')
					),
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'style': 'margin-top: 10px',
						'click': function() {
							ui.showModal(_('刷新中'), [
								E('p', { 'class': 'spinning' }, _('正在刷新数据...'))
							]);

							callBlacklist().then(function(result) {
								ui.hideModal();
								window.location.reload();
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', _('刷新失败: %s').format(err.message)), 'error');
							});
						}
					}, _('刷新'))
				]),

				// 连通分析区域
				E('div', { 'class': 'cbi-section', 'style': 'margin-top: 20px' }, [
					E('h3', {}, _('连通分析')),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('域名/IP')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('input', {
								'type': 'text',
								'class': 'cbi-input-text',
								'id': 'analyse-domain-input',
								'placeholder': 'www.google.com 或 8.8.8.8',
								'style': 'width: 300px;'
							}),
							E('button', {
								'class': 'cbi-button cbi-button-apply',
								'style': 'margin-left: 10px',
								'click': function() {
									var input = document.getElementById('analyse-domain-input').value.trim();
									if (!input) {
										ui.addNotification(null, E('p', _('请输入域名或IP')), 'error');
										return;
									}

									var resultContainer = document.getElementById('domain-analyse-result');
									resultContainer.innerHTML = '<p class="spinning">正在分析...</p>';

									// 判断是否为 IP 地址
									var isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);

									if (isIP) {
										// 直接进行 IP 隧道分析
										callAnalyseIpTunnels(input).then(function(result) {
											var rows = parseTabularData(result);
											var content = [
												E('h4', {}, input),
												createTable(
													[_('序号'), _('隧道'), _('地区'), _('分数'), _('成功'), _('失败'), _('平均首包耗时'), _('过期时间(分钟)')],
													rows,
													_('无数据')
												)
											];

											resultContainer.innerHTML = '';
											content.forEach(function(elem) {
												resultContainer.appendChild(elem);
											});
										}).catch(function(err) {
											resultContainer.innerHTML = '<p style="color: red;">分析失败: ' + err.message + '</p>';
										});
									} else {
										// 域名解析 + IP 隧道分析
										callResolveDomain(input).then(function(resolveResult) {
											var resolveRows = parseTabularData(resolveResult);

											var ips = [];
											if (resolveRows.length > 0 && resolveRows[0].length >= 5) {
												ips = resolveRows[0][4].split(',').filter(function(ip) {
													return ip.trim() !== '';
												});
											}

											var content = [
												E('h4', {}, _('域名解析')),
												createTable(
													[_('DNS'), _('域名'), _('过期时间'), _('是否置信'), _('IPS'), _('是否过期')],
													resolveRows,
													_('解析失败')
												)
											];

											if (ips.length > 0) {
												content.push(E('h4', { 'style': 'margin-top: 20px' }, _('IP 隧道分析')));

												var ipPromises = ips.map(function(ip) {
													return callAnalyseIpTunnels(ip.trim()).then(function(result) {
														var rows = parseTabularData(result);
														return {
															ip: ip.trim(),
															rows: rows
														};
													});
												});

												Promise.all(ipPromises).then(function(ipResults) {
													ipResults.forEach(function(ipResult) {
														content.push(
															E('h5', {}, ipResult.ip),
															createTable(
																[_('序号'), _('隧道'), _('地区'), _('分数'), _('成功'), _('失败'), _('平均首包耗时'), _('过期时间(分钟)')],
																ipResult.rows,
																_('无数据')
															)
														);
													});

													resultContainer.innerHTML = '';
													content.forEach(function(elem) {
														resultContainer.appendChild(elem);
													});
												});
											} else {
												resultContainer.innerHTML = '';
												content.forEach(function(elem) {
													resultContainer.appendChild(elem);
												});
											}
										}).catch(function(err) {
											resultContainer.innerHTML = '<p style="color: red;">解析失败: ' + err.message + '</p>';
										});
									}
								}
							}, _('分析'))
						])
					]),
					E('div', { 'id': 'domain-analyse-result', 'style': 'margin-top: 20px' })
				])
			]);
		}, this);

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
			initJsonArrayFromUCI("st-proxy", "area_ip_config", config['area_ip_config']['interfaces'], ipAreaFields);

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
