
# Copyright (C) 2009-2012 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#
#

include $(TOPDIR)/rules.mk

PKG_NAME:=st-proxy
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/codingdie/st-proxy.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION=LATEST_COMMIT_ID
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION)-$(PKG_SOURCE_VERSION).tar.gz

PKG_BUILD_DEPENDS:=libiconv curl leveldb

PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=codingdie

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

TARGET_CXXFLAGS +=  -O2 -flto

TARGET_LDFLAGS += -latomic

CMAKE_OPTIONS += -DOPENWRT=ON 

TARGET_CFLAGS += -I$(STAGING_DIR)/usr/lib/libiconv-full/include -liconv

TARGET_LDFLAGS += -L$(STAGING_DIR)/usr/lib/libiconv-full/lib

define Package/st-proxy
  SECTION:=net
  CATEGORY:=codingdie
  DEPENDS:=+libstdcpp +libatomic +libopenssl +libiconv-full +boost +boost-system +boost-thread +boost-filesystem  +boost-locale +curl
  TITLE:=st-proxy
  URL:=https://github.com/codingdie/st-proxy
endef

define Package/st-proxy/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_DIR) $(1)/etc/st/proxy
	$(INSTALL_DIR) $(1)/etc/st/proxy/service
	$(INSTALL_DIR) $(1)/etc/st/proxy/nat
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/st-proxy $(1)/usr/sbin/st-proxy
	$(INSTALL_CONF) ./files/config.json $(1)/etc/st/proxy/config.json
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/proxy/service/start.sh $(1)/etc/st/proxy/service/start.sh
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/proxy/service/stop.sh $(1)/etc/st/proxy/service/stop.sh
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/proxy/service/st-proxy $(1)/etc/st/proxy/service/st-proxy
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/proxy/service/st-proxy $(1)/etc/init.d/st-proxy
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/proxy/nat/init.sh $(1)/etc/st/proxy/nat/init.sh
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/etc/st/proxy/nat/rule.sh $(1)/etc/st/proxy/nat/rule.sh
endef

$(eval $(call BuildPackage,st-proxy))
