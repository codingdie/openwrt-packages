
# Copyright (C) 2009-2012 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#
#

include $(TOPDIR)/rules.mk

PKG_NAME:=st-dns
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/codingdie/st-dns.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=main
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION)-$(PKG_SOURCE_VERSION).tar.gz

PKG_BUILD_DEPENDS:=protobuf/host

PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=codingdie

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

#LTO 压缩
TARGET_CXXFLAGS +=  -O2 -flto

CMAKE_OPTIONS += -DOPENWRT=ON
CMAKE_OPTIONS += -DPROTOBUF_PROTOC_EXECUTABLE=$(STAGING_DIR_HOSTPKG)/bin/protoc 

define Package/st-dns
  SECTION:=net
  CATEGORY:=codingdie
  DEPENDS:=+curl +libstdcpp +libatomic +libopenssl +boost-system +boost-thread +boost-filesystem +boost-program_options +boost-log +boost-date_time +boost-regex +protobuf-lite +leveldb
  TITLE:=st-dns
  URL:=https://github.com/codingdie/st-dns
endef

define Package/st-dns/description
  智能 DNS 服务，支持多上游解析及按目标地区筛选结果。
  地区地址库在后台加载，同一地区的加载请求自动去重；
  下载失败后等待 60 秒再重试，下载期间不阻塞已有地址库查询。
  自动过滤上游 A 记录及历史缓存中的 127.0.0.0/8 回环地址，
  保留 localhost 域名和显式强制解析规则的回环地址支持。
endef

define Package/st-dns/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_DIR) $(1)/etc/st/dns
	$(INSTALL_DIR) $(1)/etc/st/dns/service
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/st-dns $(1)/usr/sbin/st-dns
	$(INSTALL_CONF) ./files/config.json $(1)/etc/st/dns/config.json
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/dns/service/start.sh $(1)/etc/st/dns/service/start.sh
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/dns/service/stop.sh $(1)/etc/st/dns/service/stop.sh
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/dns/service/st-dns $(1)/etc/st/dns/service/st-dns
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/dns/service/st-dns $(1)/etc/init.d/st-dns
endef

$(eval $(call BuildPackage,st-dns))
