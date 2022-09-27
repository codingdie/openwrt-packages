
# Copyright (C) 2009-2012 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#
#

include $(TOPDIR)/rules.mk

PKG_NAME:=leveldb
PKG_VERSION:=1.2.0
PKG_RELEASE:=1.2.0

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/google/leveldb.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION=a53934a3ae1244679f812d998a4f16f2c7f309a6
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION)-$(PKG_SOURCE_VERSION).tar.gz

PKG_BUILD_DEPENDS:=

PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=Google

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk


define Package/leveldb
  SECTION:=database
  CATEGORY:=codingdie
  TITLE:=leveldb
  URL:=https://github.com/google/leveldb
endef

define Package/leveldb/install
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/local/lib/libleveldb.a $(1)/usr/local/lib/libleveldb.a 
endef

$(eval $(call BuildPackage,st-proxy))
