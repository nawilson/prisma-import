import { readFile } from 'fs/promises'
import { isAbsolute, resolve } from 'path'
import chalk from 'chalk'

export async function pathsFromBase(
  filePath: string,
  quiet: boolean,
  verbose: boolean,
  paths: Set<string> = new Set(),
): Promise<string[]> {
  const absoluteFilePath = isAbsolute(filePath) ? filePath : resolve(filePath)
  const importPaths = await identifyImports(absoluteFilePath)

  paths.add(absoluteFilePath)

  if (!quiet && verbose) {
    console.log(`✔ Found imports from ${chalk.blueBright(absoluteFilePath)}`)
  }

  for (const importPath of importPaths) {
    const basePathWithoutFile = absoluteFilePath.replace(/\/[\w -]+?\.prisma$/, '/')
    const absoluteImportPath = isAbsolute(importPath) ? importPath : resolve(basePathWithoutFile, importPath)

    if (!paths.has(absoluteImportPath)) {
      const p = await pathsFromBase(absoluteImportPath, quiet, verbose, paths)

      paths.add(absoluteImportPath)
      p.forEach((s) => paths.add(s))
    }
  }

  return Array.from(paths.values())
}

async function identifyImports(file: string): Promise<string[]> {
  const content = await readFile(file, 'utf-8')
  const paths: string[] = content.split('\n').flatMap((line) => {
    const matches = /^(?<=\s*)(import\s*{.*)from "(.+)"/g.exec(line)
    return matches?.[2] ? `${matches[2]}.prisma` : []
  })

  return paths
}
