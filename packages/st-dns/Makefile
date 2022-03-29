
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
PKG_SOURCE_VERSION=LATEST_COMMIT_ID
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION)-$(PKG_SOURCE_VERSION).tar.gz

PKG_BUILD_DEPENDS:=libiconv

PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=codingdie

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

#LTO 压缩
TARGET_CXXFLAGS +=  -O2 -flto

TARGET_LDFLAGS += -latomic

CMAKE_OPTIONS += \
	-DOPENWRT=ON \
	
define Package/st-dns
  SECTION:=net
  CATEGORY:=codingdie
  DEPENDS:=+libstdcpp +libatomic +libopenssl +libiconv-full +boost +boost-system +boost-thread +boost-filesystem  +boost-locale
  TITLE:=st-dns
  URL:=https://github.com/codingdie/st-dns
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
