import { OwnedTemplateMeta } from '@ember/-internals/views';
import {
  CompileTimeComponent,
  CompileTimeResolver,
  ComponentCapabilities,
  ComponentDefinition,
  ComponentManager,
  Option,
  WithStaticLayout,
} from '@glimmer/interfaces';
import RuntimeResolver from './resolver';

interface StaticComponentManager
  extends WithStaticLayout<unknown, unknown, RuntimeResolver>,
    ComponentManager<unknown, unknown> {}

function isStaticComponentManager(
  _manager: ComponentManager,
  capabilities: ComponentCapabilities
): _manager is StaticComponentManager {
  return !capabilities.dynamicLayout;
}

export default class CompileTimeResolverImpl implements CompileTimeResolver<OwnedTemplateMeta> {
  constructor(private resolver: RuntimeResolver) {}

  lookupHelper(name: string, referrer: OwnedTemplateMeta): Option<number> {
    return this.resolver.lookupHelper(name, referrer);
  }

  lookupModifier(name: string, referrer: OwnedTemplateMeta): Option<number> {
    return this.resolver.lookupModifier(name, referrer);
  }

  lookupComponent(name: string, referrer: OwnedTemplateMeta): Option<CompileTimeComponent> {
    let definitionHandle = this.resolver.lookupComponentHandle(name, referrer);

    if (definitionHandle === null) {
      return null;
    }

    const { manager, state } = this.resolver.resolve<ComponentDefinition<unknown, unknown>>(
      definitionHandle
    );
    const capabilities = manager.getCapabilities(state);

    if (!isStaticComponentManager(manager, capabilities)) {
      return {
        handle: definitionHandle,
        capabilities,
        compilable: null,
      };
    }

    return {
      handle: definitionHandle,
      capabilities,
      compilable: manager.getStaticLayout(state, this.resolver),
    };
  }

  lookupPartial(name: string, referrer: OwnedTemplateMeta): Option<number> {
    return this.resolver.lookupPartial(name, referrer);
  }

  resolve(handle: number): OwnedTemplateMeta {
    return this.resolver.resolve(handle);
  }
}
