import type { NodeInsertionData } from './tree.type'
import { TreeNode } from './treeNode'

export class Tree<T> {
  public root: TreeNode<T>
  constructor(key: string, source: T) {
    this.root = new TreeNode<T>(key, 0, source)
  }

  /**
   * cf https://www.geeksforgeeks.org/preorder-traversal-of-binary-tree/?ref=ml_lbp
   *
   * @param treeNode
   */
  private *preOrderTraversal(treeNode = this.root): Generator<TreeNode<T>> {
    yield treeNode
    if (treeNode.children.length) {
      for (const child of treeNode.children) {
        yield* this.preOrderTraversal(child)
      }
    }
  }

  /**
   * *postOrderTraversal : D'abord les noeuds enfants puis on remonte
   * Système de parcours non utilisé.
   * cf https://www.geeksforgeeks.org/postorder-traversal-of-binary-tree/
    if (treeNode.children.length) {
      for (const child of treeNode.children) {
        yield* this.postOrderTraversal(child)
      }
    }
    yield treeNode
   */

  insert(nodeInsertionData: NodeInsertionData<T>): boolean {
    const {
      parent,
      child: { key, level, source },
    } = nodeInsertionData

    for (const treeNode of this.preOrderTraversal()) {
      if (treeNode.nodeKey === parent.key) {
        treeNode.children.push(new TreeNode<T>(key, level, source, treeNode))
        return true
      }
    }
    return false
  }

  remove(key: string): boolean {
    for (const treeNode of this.preOrderTraversal()) {
      const filtered = treeNode.children.filter((child) => child.nodeKey !== key)
      if (filtered.length !== treeNode.children.length) {
        treeNode.children = filtered
        return true
      }
    }
    return false
  }

  findByKey(key: string): TreeNode<T> | undefined {
    for (const treeNode of this.preOrderTraversal()) {
      if (treeNode.nodeKey === key) {
        return treeNode
      }
    }
    return undefined
  }

  findByKeyAndMaxLevel(key: string, maxLevel: number): TreeNode<T> | undefined {
    for (const treeNode of this.preOrderTraversal()) {
      if (treeNode.nodeKey === key && treeNode.nodeLevel <= maxLevel) {
        return treeNode
      }
    }
    return undefined
  }


  findByKeyAndLevel(key: string, level: number): TreeNode<T> | undefined {
    for (const treeNode of this.preOrderTraversal()) {
      if (treeNode.nodeKey === key && treeNode.nodeLevel === level) {
        return treeNode
      }
    }
    return undefined
  }


  filterAllByLevel(level: number): TreeNode<T>[] {
    const results: TreeNode<T>[] = []
    for (const treeNode of this.preOrderTraversal()) {
      if (treeNode.nodeLevel === level) {
        results.push(treeNode)
      }
    }
    return results
  }



  getAllTreeNodes(): TreeNode<T>[] {
    const results: TreeNode<T>[] = []
    for (const treeNode of this.preOrderTraversal()) {
      results.push(treeNode)
    }
    return results
  }

  countNode(): number {
    return [...this.preOrderTraversal()].length
  }
}
