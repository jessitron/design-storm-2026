# Readings orchestration

Reserved for coordinating observation dependencies and invoking Readings domain
operations for a supplied visit and Episode. Domain policies decide which Reading
and Provenance result; orchestration must not select fallback or assign Provenance.

No retained per-request or per-Journey business state. External translation belongs
in adapters when required, outside domain models. No provider interface or fetching
implementation is introduced yet. See the [model structure](../../../README.md#internal-structure).
