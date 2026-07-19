import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LearningLayout } from '../layouts/LearningLayout'
import { PlaygroundLayout } from '../layouts/PlaygroundLayout'
import { RootLayout } from '../layouts/RootLayout'
import { EmptyState } from '../components/shared/EmptyState'
import { ConfiguredDeveloperTool, DeveloperToolsIndexPage, JsonDiffPage, JsonFormatterPage, RegexTesterPage, toolConfigs } from '../modules/developer-tools'
import { ClampGeneratorPage } from '../modules/css-studio'
import { RestClientPage } from '../modules/api-playground'
import { CommitGraphPage } from '../modules/git-visualizer'
import { ReactSandboxPage } from '../modules/react-playground'
import { ComponentPreviewPage } from '../modules/component-playground'
import { LessonViewerPage } from '../modules/learning-hub'
import { ChatAssistantPage } from '../modules/ai-assistant'
import { RoutePlaceholder } from '../components/shared/RoutePlaceholder'
import { AuthPage } from '../pages/AuthPage'
import { SavedSnippetsPage } from '../pages/SavedSnippetsPage'
import { SavedDiffsPage } from '../pages/SavedDiffsPage'
import { RequireAuth } from '../auth/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
      },
      {
        path: 'tools',
        element: <DeveloperToolsIndexPage />,
      },
      {
        path: 'tools/json-formatter',
        element: <JsonFormatterPage />,
      },
      {
        path: 'tools/json-formatter/saved-data',
        element: <RequireAuth><SavedSnippetsPage /></RequireAuth>,
      },
      {
        path: 'tools/json-validator',
        element: <Navigate to="/tools/json-formatter" replace />,
      },
      {
        path: 'tools/json-minifier',
        element: <Navigate to="/tools/json-formatter" replace />,
      },
      {
        path: 'tools/json-diff',
        element: <JsonDiffPage />,
      },
      {
        path: 'tools/json-diff/saved-data',
        element: <RequireAuth><SavedDiffsPage /></RequireAuth>,
      },
      {
        path: 'tools/regex-tester',
        element: <RegexTesterPage />,
      },
      {
        path: 'tools/jwt-decoder',
        element: <ConfiguredDeveloperTool config={toolConfigs['jwt-decoder']} />,
      },
      {
        path: 'tools/base64',
        element: <ConfiguredDeveloperTool config={toolConfigs.base64} />,
      },
      {
        path: 'tools/url-encoder',
        element: <ConfiguredDeveloperTool config={toolConfigs['url-encoder']} />,
      },
      {
        path: 'tools/hash-generator',
        element: <ConfiguredDeveloperTool config={toolConfigs['hash-generator']} />,
      },
      {
        path: 'tools/uuid-generator',
        element: <ConfiguredDeveloperTool config={toolConfigs['uuid-generator']} />,
      },
      {
        path: 'tools/timestamp-converter',
        element: <ConfiguredDeveloperTool config={toolConfigs['timestamp-converter']} />,
      },
      {
        path: 'tools/text-case-converter',
        element: <ConfiguredDeveloperTool config={toolConfigs['text-case-converter']} />,
      },
      {
        path: 'css',
        element: <ClampGeneratorPage />,
      },
      {
        path: 'css/gradient-generator',
        element: <ClampGeneratorPage />,
      },
      {
        path: 'css/box-shadow',
        element: <RoutePlaceholder title="Box Shadow" />,
      },
      {
        path: 'css/border-radius',
        element: <RoutePlaceholder title="Border Radius" />,
      },
      {
        path: 'css/flexbox',
        element: <RoutePlaceholder title="Flexbox Builder" />,
      },
      {
        path: 'css/grid',
        element: <RoutePlaceholder title="CSS Grid Builder" />,
      },
      {
        path: 'css/tailwind-builder',
        element: <RoutePlaceholder title="Tailwind Builder" />,
      },
      {
        path: 'api',
        element: <RoutePlaceholder title="API" />,
      },
      {
        path: 'api/playground',
        element: <RestClientPage />,
      },
      {
        path: 'api/history',
        element: <RoutePlaceholder title="API History" />,
      },
      {
        path: 'api/collections',
        element: <RoutePlaceholder title="API Collections" />,
      },
      {
        path: 'api/environments',
        element: <RoutePlaceholder title="API Environments" />,
      },
      {
        path: 'git',
        element: <CommitGraphPage />,
      },
      {
        path: 'git/visualizer',
        element: <CommitGraphPage />,
      },
      {
        path: 'git/simulator',
        element: <CommitGraphPage />,
      },
      {
        path: 'git/learn',
        element: <RoutePlaceholder title="Learn Git" />,
      },
      {
        path: 'playground',
        element: <PlaygroundLayout />,
      },
      {
        path: 'playground/react',
        element: <ReactSandboxPage />,
      },
      {
        path: 'playground/components',
        element: <ComponentPreviewPage />,
      },
      {
        path: 'learn',
        element: <LearningLayout />,
      },
      {
        path: 'learn/html',
        element: <LessonViewerPage />,
      },
      {
        path: 'learn/css',
        element: <LessonViewerPage />,
      },
      {
        path: 'learn/javascript',
        element: <LessonViewerPage />,
      },
      {
        path: 'learn/react',
        element: <LessonViewerPage />,
      },
      {
        path: 'learn/git',
        element: <LessonViewerPage />,
      },
      {
        path: 'saved',
        element: <Navigate to="/tools/json-formatter/saved-data" replace />,
      },
      {
        path: 'favorites',
        element: <RoutePlaceholder title="Favorites" />,
      },
      {
        path: 'settings',
        element: <RoutePlaceholder title="Settings" />,
      },
      {
        path: 'login',
        element: <AuthPage mode="login" />,
      },
      {
        path: 'signup',
        element: <AuthPage mode="signup" />,
      },
      {
        path: 'profile',
        element: <ChatAssistantPage />,
      },
      {
        path: '*',
        element: <EmptyState title="Page not found" description="Choose a section from the sidebar." />,
      },
    ],
  },
])
