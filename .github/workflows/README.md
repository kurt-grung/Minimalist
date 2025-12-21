# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### `ci.yml` - Continuous Integration
- **Triggers**: Push and pull requests to `main` and `develop` branches
- **Jobs**:
  - **Test**: Runs unit tests on Node.js 18.x, 20.x, and 22.x
    - Installs dependencies
    - Runs test suite
    - Generates coverage reports
    - Uploads coverage artifacts
  - **Build**: Verifies the package builds successfully
    - Compiles TypeScript
    - Verifies build artifacts exist

### `lint.yml` - Linting and Type Checking
- **Triggers**: Push and pull requests to `main` and `develop` branches
- **Jobs**:
  - **Lint**: Type checks the codebase
    - Runs TypeScript compiler in check mode
    - Validates type safety

### `demo.yml` - Demo Project Build
- **Triggers**: Changes to `demo/` or `cms/` directories, or manual dispatch
- **Jobs**:
  - **Build Demo**: Builds the demo Next.js project
    - Builds CMS package first
    - Installs demo dependencies
    - Builds demo project
    - Verifies build output

### `release.yml` - Release Workflow
- **Triggers**: GitHub releases or manual dispatch
- **Jobs**:
  - **Build and Test**: Ensures package is ready for release
    - Runs full test suite
    - Builds the package
    - Verifies all artifacts
  - **Publish** (commented out): Optional npm publishing
    - Requires `NPM_TOKEN` secret
    - Uncomment and configure if needed

## Usage

### Running Tests Locally
```bash
# From root
npm test

# Or from cms directory
cd cms
npm test
```

### Viewing Coverage
Coverage reports are uploaded as artifacts in the CI workflow. Download them from the Actions tab.

### Manual Workflow Dispatch
Some workflows support manual triggering:
1. Go to Actions tab in GitHub
2. Select the workflow
3. Click "Run workflow"

## Secrets

If you want to enable npm publishing in `release.yml`, add:
- `NPM_TOKEN`: Your npm authentication token

## Cache

Workflows use npm cache to speed up dependency installation. The cache is automatically managed by GitHub Actions based on `package-lock.json` files.

