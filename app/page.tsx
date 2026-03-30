import { getAllProblems } from '@/lib/notion'
import BuildThisApp from '@/components/BuildThisApp'

export const revalidate = 3600

export default async function Home() {
  const problems = await getAllProblems()
  return <BuildThisApp problems={problems} />
}
