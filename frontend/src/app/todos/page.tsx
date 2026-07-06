import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul className="p-6 space-y-2">
      {todos?.map((todo: any) => (
        <li key={todo.id} className="text-slate-800 font-medium">
          {todo.name}
        </li>
      ))}
    </ul>
  )
}
