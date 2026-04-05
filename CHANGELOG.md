# Changelog

## 0.1.8

### Other Changes

- Merge pull request #75 from ricjhill/feature/docker-external-network
- Add full-stack Docker tutorial and update getting-started docs
- Use external riskflow network, remove duplicate api/redis services


## 0.1.7

### Other Changes

- Merge pull request #74 from ricjhill/feature/sync-field-error-types
- Sync OpenAPI types: add FieldError and RowError.field_errors


## 0.1.6

### Other Changes

- Merge pull request #73 from ricjhill/feature/upload-back-state
- Fix destroy error visibility and Windows path handling
- Add upload summary styling (#36)
- RED/GREEN: Re-upload button destroys session and shows form (#36)
- RED/GREEN: UploadStep shows summary when session exists (#36)


## 0.1.5

### Other Changes

- Merge pull request #72 from ricjhill/feature/results-step-polish
- Fix onFinalised firing on failure; add negative test
- Fix TypeScript spread error in missing fields test
- Add confidence detail styling (#39)
- RED/GREEN: Stepper shows completed state after finalisation (#41)
- RED/GREEN: ResultsStep calls onFinalised after finalisation (#41)
- RED/GREEN: ResultsStep shows missing target fields (#39)
- RED/GREEN: ResultsStep shows low confidence fields (#39)


## 0.1.4

### Other Changes

- Merge pull request #63 from ricjhill/feature/upload-filename-spinner
- Add spinner CSS animation for upload button (#40)
- RED/GREEN: Upload button shows spinner during upload (#40)
- Add filename display styling to FileUpload (#35)
- RED/GREEN: UploadStep shows selected filename (#35)
- RED/GREEN: FileUpload displays selected filename (#35)


## 0.1.3

### Other Changes

- Merge pull request #62 from ricjhill/feature/nav-header-and-404
- RED/GREEN: App shows NotFound with Header for unknown routes
- RED/GREEN: App renders Header on all routes
- RED/GREEN: NotFound renders heading and home link (closes #37)
- Add Header CSS with responsive layout and active indicator
- RED/GREEN: Header highlights active page via aria-current
- RED/GREEN: Header renders nav links to Flow Mapper and API Status
- RED/GREEN: Header renders app name linking to home (closes #38)


## 0.1.2

### Other Changes

- Merge pull request #61 from ricjhill/feature/docs-update
- Update Diataxis docs with features, tutorials, and reference guides


## 0.1.1

### Other Changes

- Merge pull request #60 from ricjhill/feature/cleanup
- Add missing /health and /sheets endpoints to CLAUDE.md

