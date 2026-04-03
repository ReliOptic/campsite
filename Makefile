PREFIX ?= $(HOME)/.campsite
VERSION := $(shell cat VERSION 2>/dev/null || git describe --tags --always 2>/dev/null || echo dev)
CURDIR := $(shell pwd)

SHELL_FILES := bin/campsite $(wildcard lib/*.sh) $(wildcard adapters/*.sh)

.PHONY: help install uninstall dev test test-unit test-integration test-hybrid lint check

help:
	@printf '%s\n' \
		"campsite $(VERSION)" \
		"" \
		"Installation:" \
		"  make install     Install to $(PREFIX)" \
		"  make uninstall   Remove from $(PREFIX) (preserves user config)" \
		"  make dev         Symlink for development (edits go live immediately)" \
		"" \
		"Development:" \
		"  make test        Run all tests (unit + integration)" \
		"  make test-unit   Run unit tests only" \
		"  make test-integration  Run integration tests only" \
		"  make test-hybrid Run the hybrid smoke harness + review guidance" \
		"  make lint        Run shellcheck on all shell files" \
		"  make check       Run lint + test"

install:
	@mkdir -p "$(PREFIX)/bin" "$(PREFIX)/lib" "$(PREFIX)/adapters" \
		"$(PREFIX)/templates" "$(PREFIX)/config" "$(PREFIX)/user/adapters"
	@cp bin/campsite "$(PREFIX)/bin/campsite"
	@chmod +x "$(PREFIX)/bin/campsite"
	@if [ -d lib ] && ls lib/*.sh >/dev/null 2>&1; then \
		cp lib/*.sh "$(PREFIX)/lib/"; \
	fi
	@if ls adapters/* >/dev/null 2>&1; then \
		cp adapters/* "$(PREFIX)/adapters/"; \
	fi
	@cp templates/* "$(PREFIX)/templates/"
	@if [ -f config/defaults.sh ]; then \
		cp config/defaults.sh "$(PREFIX)/config/defaults.sh"; \
	fi
	@printf '%s\n' "$(VERSION)" > "$(PREFIX)/VERSION"
	@if [ ! -f "$(PREFIX)/user/config.sh" ]; then \
		printf '%s\n' '#!/usr/bin/env bash' \
			'# Campsite user configuration' \
			'# CAMPSITE_WORKSPACE="/path/to/workspace"' \
			> "$(PREFIX)/user/config.sh"; \
	fi
	@printf '\033[32m%s\033[0m\n' "campsite $(VERSION) installed to $(PREFIX)"
	@printf '%s\n' "Ensure $(PREFIX)/bin is in your PATH:"
	@printf '%s\n' '  export CAMPSITE_HOME="$$HOME/.campsite"'
	@printf '%s\n' '  export PATH="$$CAMPSITE_HOME/bin:$$PATH"'

uninstall:
	@rm -rf "$(PREFIX)/bin" "$(PREFIX)/lib" "$(PREFIX)/adapters" \
		"$(PREFIX)/templates" "$(PREFIX)/config" "$(PREFIX)/VERSION"
	@printf '\033[32m%s\033[0m\n' "campsite removed from $(PREFIX)"
	@printf '%s\n' "User config preserved at $(PREFIX)/user/"
	@printf '%s\n' "Remove PATH entries from your shell profile manually."

dev:
	@mkdir -p "$(PREFIX)/bin" "$(PREFIX)/lib" "$(PREFIX)/adapters" \
		"$(PREFIX)/templates" "$(PREFIX)/config" "$(PREFIX)/user/adapters"
	@ln -sf "$(CURDIR)/bin/campsite" "$(PREFIX)/bin/campsite"
	@if [ -d "$(CURDIR)/lib" ]; then \
		for f in "$(CURDIR)"/lib/*.sh; do \
			[ -f "$$f" ] && ln -sf "$$f" "$(PREFIX)/lib/$$(basename $$f)"; \
		done; \
	fi
	@if [ -d "$(CURDIR)/adapters" ]; then \
		for f in "$(CURDIR)"/adapters/*; do \
			[ -f "$$f" ] && ln -sf "$$f" "$(PREFIX)/adapters/$$(basename $$f)"; \
		done; \
	fi
	@for f in "$(CURDIR)"/templates/*; do \
		[ -f "$$f" ] && ln -sf "$$f" "$(PREFIX)/templates/$$(basename $$f)"; \
	done
	@if [ -f "$(CURDIR)/config/defaults.sh" ]; then \
		ln -sf "$(CURDIR)/config/defaults.sh" "$(PREFIX)/config/defaults.sh"; \
	fi
	@printf '%s\n' "$(VERSION)" > "$(PREFIX)/VERSION"
	@printf '\033[32m%s\033[0m\n' "campsite dev mode: $(PREFIX) -> $(CURDIR)"

test: test-unit test-integration
	@printf '\033[32m%s\033[0m\n' "All tests passed"

test-unit:
	@if [ -d tests/unit ] && ls tests/unit/*.bats >/dev/null 2>&1; then \
		printf '%s\n' "Running unit tests..."; \
		bats tests/unit/; \
	else \
		printf '%s\n' "No unit tests found (tests/unit/*.bats)"; \
	fi

test-integration:
	@if [ -d tests/integration ] && ls tests/integration/*.bats >/dev/null 2>&1; then \
		printf '%s\n' "Running integration tests..."; \
		bats tests/integration/; \
	else \
		printf '%s\n' "No integration tests found (tests/integration/*.bats)"; \
	fi

test-smoke:
	@printf '%s\n' "Running smoke tests..."
	@bash bin/campsite --version
	@printf '\033[32m%s\033[0m\n' "Smoke tests passed"

test-hybrid:
	@printf '%s\n' "Running hybrid smoke harness..."
	@bash scripts/hybrid-smoke.sh
	@printf '%s\n' ""
	@printf '%s\n' "Manual review gate:"
	@printf '%s\n' "  1. Open the camp scene and check 5-second clarity"
	@printf '%s\n' "  2. Verify Focus mode and Camp mode use the same state language"
	@printf '%s\n' "  3. Verify the output feels calm, not frantic"
	@printf '\033[32m%s\033[0m\n' "Hybrid smoke complete"

lint:
	@printf '%s\n' "Running shellcheck..."
	@if command -v shellcheck >/dev/null 2>&1; then \
		shellcheck -x $(SHELL_FILES); \
		printf '\033[32m%s\033[0m\n' "Lint passed"; \
	else \
		printf '\033[33m%s\033[0m\n' "shellcheck not installed. Install with: apt install shellcheck"; \
		exit 1; \
	fi

check: lint test
