import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ key: string }>;
}

export default async function ShortTaskRedirect({ params }: Props) {
  const { key } = await params;
  redirect(`/task/${key}`);
}
