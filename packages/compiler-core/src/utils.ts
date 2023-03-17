import { isString } from '@vue/shared'
import { ElementTypes, NodeTypes } from './ast'
import { CREATE_ELEMENT_VNODE, CREATE_VNODE } from './runtimeHelpers'

export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}
/**
 * 返回 vnode 生成函数
 */
export function getVNodeHelper(ssr: boolean, isComponent: boolean) {
  return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE
}
/**
 * 是否为 v-slot
 */
export function isVSlot(p) {
  return p.type === NodeTypes.DIRECTIVE && p.name === 'slot'
}

/**
 * 创建对象表达式节点
 */
export function createObjectExpression(properties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc: {},
    properties
  }
}

export function injectProp(node, prop) {
  let propsWithInjection
  let props =
    node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2]

  if (props == null || isString(props)) {
    propsWithInjection = createObjectExpression([prop])
  }
  if (node.type === NodeTypes.VNODE_CALL) {
    node.props = propsWithInjection
  }
}

/**
 * 返回 vnode 节点
 */
export function getMemoedVNodeCall(node) {
  return node
}

export function isTemplateNode(node) {
  return (
    node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.TEMPLATE
  )
}

const nonIdentifierRE = /^\d|[^\$\w]/
export const isSimpleIdentifier = (name: string): boolean =>
  !nonIdentifierRE.test(name)

const enum MemberExpLexState {
  inMemberExp,
  inBrackets,
  inParens,
  inString
}

const validFirstIdentCharRE = /[A-Za-z_$\xA0-\uFFFF]/
const validIdentCharRE = /[\.\?\w$\xA0-\uFFFF]/
const whitespaceRE = /\s+[.[]\s*|\s*[.[]\s+/g

export const isMemberExpressionBrowser = (path: string): boolean => {
  // remove whitespaces around . or [ first
  path = path.trim().replace(whitespaceRE, s => s.trim())

  let state = MemberExpLexState.inMemberExp
  let stateStack: MemberExpLexState[] = []
  let currentOpenBracketCount = 0
  let currentOpenParensCount = 0
  let currentStringType: "'" | '"' | '`' | null = null

  for (let i = 0; i < path.length; i++) {
    const char = path.charAt(i)
    switch (state) {
      case MemberExpLexState.inMemberExp:
        if (char === '[') {
          stateStack.push(state)
          state = MemberExpLexState.inBrackets
          currentOpenBracketCount++
        } else if (char === '(') {
          stateStack.push(state)
          state = MemberExpLexState.inParens
          currentOpenParensCount++
        } else if (
          !(i === 0 ? validFirstIdentCharRE : validIdentCharRE).test(char)
        ) {
          return false
        }
        break
      case MemberExpLexState.inBrackets:
        if (char === `'` || char === `"` || char === '`') {
          stateStack.push(state)
          state = MemberExpLexState.inString
          currentStringType = char
        } else if (char === `[`) {
          currentOpenBracketCount++
        } else if (char === `]`) {
          if (!--currentOpenBracketCount) {
            state = stateStack.pop()!
          }
        }
        break
      case MemberExpLexState.inParens:
        if (char === `'` || char === `"` || char === '`') {
          stateStack.push(state)
          state = MemberExpLexState.inString
          currentStringType = char
        } else if (char === `(`) {
          currentOpenParensCount++
        } else if (char === `)`) {
          // if the exp ends as a call then it should not be considered valid
          if (i === path.length - 1) {
            return false
          }
          if (!--currentOpenParensCount) {
            state = stateStack.pop()!
          }
        }
        break
      case MemberExpLexState.inString:
        if (char === currentStringType) {
          state = stateStack.pop()!
          currentStringType = null
        }
        break
    }
  }
  return !currentOpenBracketCount && !currentOpenParensCount
}
