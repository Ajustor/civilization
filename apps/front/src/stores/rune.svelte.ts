import { getContext, hasContext, setContext } from 'svelte'

export const rune = <T>(startValue: T, context = 'default') => {
  if (hasContext(context)) {
    return getContext<{ value: T }>(context)
  }

  let _state = $state(startValue)

  const _rune = {
    get value() {
      return _state
    },
    set value(newState: T) {
      _state = newState
    }
  }

  setContext(context, _state)
  return _rune
}