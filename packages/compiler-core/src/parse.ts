import { ElementTypes, NodeTypes } from './ast'

/**
 * 解析器上下文
 */
export interface ParserContext {
  // 模板数据源
  source: string
}

/**
 * 标签类型，包含：开始和结束
 */
const enum TagType {
  Start,
  End
}

/**
 * 基础的 parse 方法，生成 AST
 * @param content tempalte 模板
 * @returns
 */
export function baseParse(content: string) {
  // 创建 parser 对象，未解析器的上下文对象
  const context = createParserContext(content)
  const children = parseChildren(context, [])
  return createRoot(children)
}

/**
 * 创建解析器上下文
 */
function createParserContext(content: string): ParserContext {
  // 合成 context 上下文对象
  return {
    source: content
  }
}

function parseChildren(context: ParserContext, ancestors) {
  // 存放所有 node节点数据的数组
  const nodes = []
  /**
   * 循环解析所有 node 节点，可以理解为对 token 的处理。
   * 例如：<div>hello world</div>，此时的处理顺序为：
   * 1. <div
   * 2. >
   * 3. hello world
   * 4. </
   * 5. div>
   */
  while (!isEnd(context, ancestors)) {
    /**
     * 模板源
     */
    const s = context.source
    // 定义 node 节点
    let node
    if (startsWith(s, '{{')) {
      // node = parseInterpolation(context)
    } else if (s[0] === '<') {
      // 以 < 开始，后面跟a-z 表示，这是一个标签的开始
      if (/[a-z]/i.test(s[1])) {
        // 此时要处理 Element
        node = parseElement(context, ancestors)
      }
    }

    if (!node) {
      node = parseText(context)
    }

    pushNode(nodes, node)
  }
  return nodes
}

/**
 * 解析 Element 元素。例如：<div>
 */
function parseElement(context: ParserContext, ancestors) {
  // -- 先处理开始标签 --
  const element = parseTag(context, TagType.Start)

  //   //  -- 处理子节点 --
  ancestors.push(element)
  //   // 递归触发 parseChildren
  const children = parseChildren(context, ancestors)
  ancestors.pop()
  //   // 为子节点赋值
  element.children = children

  //   //  -- 最后处理结束标签 --
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }

  // 整个标签处理完成
  return element
}

/**
 * 解析文本。
 */
function parseText(context: ParserContext) {
  /**
   * 定义普通文本结束的标记
   * 例如：hello world </div>，那么文本结束的标记就为 <
   * PS：这也意味着如果你渲染了一个 <div> hell<o </div> 的标签，那么你将得到一个错误
   */
  const endTokens = ['<', '{{']
  // 计算普通文本结束的位置
  let endIndex = context.source.length

  // 计算精准的 endIndex，计算的逻辑为：从 context.source 中分别获取 '<', '{{' 的下标，取最小值为 endIndex
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  // 获取处理的文本内容
  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

/**
 * 从指定位置（length）获取给定长度的文本数据。
 */
function parseTextData(context: ParserContext, length: number): string {
  // 获取指定的文本数据
  const rawText = context.source.slice(0, length)
  // 《继续》对模板进行解析处理
  advanceBy(context, length)
  // 返回获取到的文本
  return rawText
}

/**
 * 解析标签
 */
function parseTag(context: any, type: TagType): any {
  // -- 处理标签开始部分 --

  // 通过正则获取标签名
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)
  // 标签名字
  const tag = match[1]

  // 对模板进行解析处理
  advanceBy(context, match[0].length)

  //   // 属性与指令处理
  //   advanceSpaces(context)
  //   let props = parseAttributes(context, type)

  //   // -- 处理标签结束部分 --

  //   // 判断是否为自关闭标签，例如 <img />
  let isSelfClosing = startsWith(context.source, '/>')
  //   // 《继续》对模板进行解析处理，是自动标签则处理两个字符 /> ，不是则处理一个字符 >
  advanceBy(context, isSelfClosing ? 2 : 1)

  //   // 标签类型
  let tagType = ElementTypes.ELEMENT

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    // 属性与指令
    props: []
  }
}

/**
 * 是否以指定文本开头
 */
function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString)
}

/**
 * 判断是否为结束节点
 */
function isEnd(context: ParserContext, ancestors): boolean {
  const s = context.source

  // 解析是否为结束标签
  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }
  return !s
}

/**
 * 前进一步。多次调用，每次调用都会处理一部分的模板内容
 * 以 <div>hello world</div> 为例
 * 1. <div
 * 2. >
 * 3. hello world
 * 4. </div
 * 5. >
 */
function advanceBy(context: ParserContext, numberOfCharacters: number): void {
  // template 模板源
  const { source } = context
  // 去除开始部分的无效数据
  context.source = source.slice(numberOfCharacters)
}

/**
 * nodes.push(node)
 */
function pushNode(nodes, node): void {
  nodes.push(node)
}

/**
 * 判断当前是否为《标签结束的开始》。比如 </div> 就是 div 标签结束的开始
 * @param source 模板。例如：</div>
 * @param tag 标签。例如：div
 * @returns
 */
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, '</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}

/**
 * 生成 root 节点
 */
export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    // loc：位置，这个属性并不影响渲染，但是它必须存在，否则会报错。所以我们给了他一个 {}
    loc: {}
  }
}
