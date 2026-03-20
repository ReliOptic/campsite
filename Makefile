.PHONY: help bootstrap validate summary enter leave handoff start finish

help:
\t@printf '%s\n' "Targets:" "  bootstrap PROJECT=/abs/path  scaffold a Campsite project" "  validate PROJECT=/abs/path   validate a Campsite project" "  summary [PROJECTS=/abs/path] list project states" "  enter PROJECT=/abs/path      enter a project checkpoint" "  handoff PROJECT=/abs/path    show current state and next action" "  leave PROJECT=/abs/path      release project session lock"

bootstrap:
\t@test -n "$(PROJECT)" || (printf '%s\n' "PROJECT is required"; exit 1)
\t@sh ./bin/campsite init "$(PROJECT)"

validate:
\t@test -n "$(PROJECT)" || (printf '%s\n' "PROJECT is required"; exit 1)
\t@sh ./bin/campsite validate "$(PROJECT)"

summary:
\t@if [ -n "$(PROJECTS)" ]; then sh ./bin/campsite summary "$(PROJECTS)"; else sh ./bin/campsite summary; fi

enter:
\t@test -n "$(PROJECT)" || (printf '%s\n' "PROJECT is required"; exit 1)
\t@sh ./bin/campsite enter "$(PROJECT)"

handoff:
\t@test -n "$(PROJECT)" || (printf '%s\n' "PROJECT is required"; exit 1)
\t@sh ./bin/campsite handoff "$(PROJECT)"

leave:
\t@test -n "$(PROJECT)" || (printf '%s\n' "PROJECT is required"; exit 1)
\t@sh ./bin/campsite leave "$(PROJECT)"

start: enter

finish: leave
