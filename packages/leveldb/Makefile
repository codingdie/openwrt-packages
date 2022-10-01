
# Copyright (C) 2009-2012 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#
#

include $(TOPDIR)/rules.mk

PKG_NAME:=leveldb
PKG_VERSION:=1.23
PKG_RELEASE:=${PKG_VERSION}
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/google/leveldb/archive/refs/tags/1.23.tar.gz?
PKG_HASH:=9a37f8a6174f09bd622bc723b55881dc541cd50747cbd08831c2a82d620f6d76

PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=Google

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

CMAKE_OPTIONS += -DCMAKE_BUILD_TYPE=Release -DLEVELDB_BUILD_TESTS=off  -DLEVELDB_BUILD_BENCHMARKS=off 

define Package/leveldb
  SECTION:=database
  CATEGORY:=codingdie
  TITLE:=leveldb
  URL:=https://github.com/google/leveldb
endef


define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include/
	$(CP) $(PKG_INSTALL_DIR)/usr/include/* $(1)/usr/include/
	$(INSTALL_DIR) $(1)/usr/lib/
	$(CP) -r $(PKG_INSTALL_DIR)/usr/lib/* $(1)/usr/lib/
endef

$(eval $(call BuildPackage,leveldb))