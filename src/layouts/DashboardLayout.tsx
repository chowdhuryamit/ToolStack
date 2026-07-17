import { ToolCard } from '../components/shared/ToolCard'
import { APP_NAME, TOOL_CATEGORIES } from '../app/constants'

const categoryLinks: Record<string, string> = {
  'developer-tools': '/tools',
  'css-studio': '/css',
  'api-playground': '/api',
  'git-visualizer': '/git',
  'react-playground': '/playground/react',
  'component-playground': '/playground/components',
  'learning-hub': '/learn',
  'ai-assistant': '/profile',
}

const categoryDetails: Record<string, { title: string; description: string }> = {
  'developer-tools': {
    title: 'Developer Tools',
    description: 'Format, validate, and transform everyday developer data without leaving your workspace.',
  },
  'css-studio': {
    title: 'CSS Studio',
    description: 'Shape gradients, shadows, and polished styles with instant visual feedback.',
  },
  'api-playground': {
    title: 'API Playground',
    description: 'Compose requests, inspect responses, and debug endpoints in one focused client.',
  },
  'git-visualizer': {
    title: 'Git Visualizer',
    description: 'Trace branches, commits, and merges through a clear interactive history.',
  },
  'react-playground': {
    title: 'React Playground',
    description: 'Prototype components in a live sandbox with code, preview, and console side by side.',
  },
  'component-playground': {
    title: 'Component Playground',
    description: 'Explore component states, tune props, and compare variants before shipping.',
  },
  'learning-hub': {
    title: 'Learning Hub',
    description: 'Build practical skills with concise lessons designed around real developer workflows.',
  },
  'ai-assistant': {
    title: 'AI Assistant',
    description: 'Brainstorm, troubleshoot, and move from question to working solution faster.',
  },
}

export function DashboardLayout() {
  return (
    <section className="page-stack dashboard">
      <div className="hero-panel">
        <p className="eyebrow">Unified developer workspace</p>
        <h1>{APP_NAME}</h1>
        <p className="muted">Format JSON, design CSS, test APIs, visualize Git, prototype React, and ask the assistant from one low-strain command center.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="/tools/json-formatter">Start formatting</a>
          <a className="button button-secondary" href="/api/playground">Open API lab</a>
        </div>
      </div>
      <div className="bento-grid">
        {TOOL_CATEGORIES.map((category) => (
          <ToolCard
            key={category}
            title={categoryDetails[category].title}
            href={categoryLinks[category]}
            description={categoryDetails[category].description}
            meta="Module"
            category={category}
            featured={category === 'ai-assistant' || category === 'react-playground'}
          />
        ))}
      </div>
    </section>
  )
}
