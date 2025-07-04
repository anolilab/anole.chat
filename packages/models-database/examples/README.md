# Examples

This folder contains comprehensive examples demonstrating all features of the `@visulima/models-database` package.

**Data Source**: All examples use data from [SST's models.dev project](https://github.com/sst/models.dev/tree/dev).

## Available Examples

### 📊 [basic-usage.js](./basic-usage.js)
**Core functionality demonstration**
- Getting database statistics
- Basic search operations
- Listing all providers
- Getting total model counts

```bash
node examples/basic-usage.js
```

### 🔍 [search-filters.js](./search-filters.js)
**Advanced search and filtering**
- Text search across models
- Provider-specific filtering
- Feature-based filters (vision, tools, reasoning)
- Pricing and context window filters
- Sorting and result limiting
- Complex multi-criteria searches

```bash
node examples/search-filters.js
```

### 🏢 [provider-info.js](./provider-info.js)
**Provider analysis and comparison**
- Getting detailed provider information
- Listing models by provider
- Provider statistics and comparison
- Top providers by different categories
- Provider capabilities analysis

```bash
node examples/provider-info.js
```

### 💰 [pricing-comparison.js](./pricing-comparison.js)
**Cost analysis and pricing insights**
- Finding free vs paid models
- Cheapest and most expensive models
- Budget-based recommendations
- Feature-to-cost analysis
- Price tier breakdown
- Cost efficiency scoring

```bash
node examples/pricing-comparison.js
```

### 🎯 [model-details.js](./model-details.js)
**In-depth model information**
- Getting specific model details
- Model-to-model comparisons
- Feature analysis and capabilities
- Recently updated models
- Specialty model types (open source, multimodal)
- Model specifications breakdown

```bash
node examples/model-details.js
```

## Quick Start

```bash
# Or run individual examples
node examples/basic-usage.js
node examples/search-filters.js
node examples/provider-info.js
node examples/pricing-comparison.js
node examples/model-details.js
```

## Example Output Preview

Each example provides rich, formatted output showing:

- 📊 Statistics and counts
- 🔍 Search results with filtering
- 💰 Pricing comparisons and analysis
- 🏢 Provider information and rankings
- 🎯 Detailed model specifications
- ⚖️ Side-by-side model comparisons

## Use Cases Covered

### For Developers
- **Model Selection**: Find the right model for your use case
- **Cost Optimization**: Compare pricing across providers
- **Feature Requirements**: Filter by capabilities needed
- **Integration Planning**: Get provider-specific details

### For Researchers
- **Market Analysis**: Compare AI model landscape
- **Pricing Trends**: Analyze cost structures
- **Feature Evolution**: Track capability development
- **Provider Comparison**: Evaluate different AI companies

### For Decision Makers
- **Budget Planning**: Understand AI model costs
- **Vendor Evaluation**: Compare provider offerings
- **Technology Assessment**: Evaluate AI capabilities
- **Strategic Planning**: Plan AI implementation

## Data Attribution

All examples use data from the excellent [models.dev](https://models.dev) project by [SST](https://sst.dev). The database includes comprehensive information about AI models from major providers including OpenAI, Anthropic, Google, Microsoft, and many others.

- **Repository**: https://github.com/sst/models.dev
- **API**: https://models.dev/api.json
- **Contributors**: SST team and community

## Need Help?

- Check the main [README](../README.md) for full API documentation
- Review individual example files for specific use cases
- Run `pnpm test` to see the package in action with tests 