# Contributing to Stogram

First off, thank you for considering contributing to Stogram! It's people like you that make Stogram such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List some examples of how it would be used**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue that pull request!

## Development Process

### Setting Up Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stogram.git
   cd stogram
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

### Coding Standards

#### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

#### React Components

- Use functional components with hooks
- Keep components small and reusable
- Use proper prop types
- Follow the component structure:
  ```tsx
  import statements
  
  interface Props { }
  
  export default function Component({ props }: Props) {
    // hooks
    // handlers
    // effects
    
    return ( /* JSX */ )
  }
  ```

#### CSS/Styling

- Use TailwindCSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and sizing
- Use CSS variables for theming

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests

Examples:
```
feat: Add voice message recording
fix: Resolve WebSocket connection issue
docs: Update deployment guide
style: Format code with Prettier
refactor: Simplify authentication logic
test: Add tests for message service
chore: Update dependencies
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

Example: `feature/voice-messages`

## Project Structure

```
stogram/
├── client/           # React frontend
│   ├── public/       # Static files
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── hooks/       # Custom hooks
│       ├── services/    # API services
│       ├── store/       # State management
│       ├── types/       # TypeScript types
│       └── utils/       # Utility functions
├── server/           # Node.js backend
│   ├── prisma/       # Database schema
│   └── src/
│       ├── controllers/  # Route controllers
│       ├── middleware/   # Express middleware
│       ├── routes/       # API routes
│       ├── services/     # Business logic
│       ├── socket/       # WebSocket handlers
│       └── utils/        # Utility functions
└── docs/             # Documentation
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run client tests
cd client && npm test

# Run server tests
cd server && npm test

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Aim for at least 80% code coverage

## Documentation

- Update README.md if needed
- Update API documentation for new endpoints
- Add JSDoc comments for functions
- Update user guide for new features

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a release branch
4. Tag the release
5. Create GitHub release with notes

## Questions?

Feel free to ask questions in:
- GitHub Discussions
- Discord server
- Email: dev@stogram.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
