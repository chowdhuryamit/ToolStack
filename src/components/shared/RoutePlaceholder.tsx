import { EmptyState } from './EmptyState'

type RoutePlaceholderProps = {
  title: string
}

export function RoutePlaceholder({ title }: RoutePlaceholderProps) {
  return <EmptyState title={title} description="This route is ready for its feature implementation." />
}
