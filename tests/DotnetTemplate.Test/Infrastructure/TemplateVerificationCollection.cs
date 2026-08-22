using Xunit;

namespace DotnetTemplate.Test.Infrastructure;

[CollectionDefinition("TemplateVerification", DisableParallelization = true)]
public sealed class TemplateVerificationCollection : ICollectionFixture<TemplatePackFixture>;
