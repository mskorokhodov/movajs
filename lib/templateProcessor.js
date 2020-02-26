import {
  DefaultTemplateProcessor,
  AttributeCommitter as DefaultAttributeCommitter,
  AttributePart as DefaultAttributePart,
  PropertyCommitter as DefaultPropertyCommitter
} from 'lit-html';
import { isObject, isFunction, kebabCase } from 'lodash';
import { Element } from './element';

class ClassPart extends DefaultAttributePart {
  setValue(value) {
    if (isObject(value)) {
      value = Object.keys(value).filter(key => value[key]).join(' ');
    }

    super.setValue(value);
  }
}

class StylePart extends DefaultAttributePart {
  setValue(value) {
    if (isObject(value)) {
      value = Object.entries(value)
        .map(([key, value]) => [kebabCase(key), value])
        .map((entry) => entry.join(': ')).join('; ')
    }

    super.setValue(value);
  }
}

class RefCommitter extends DefaultAttributeCommitter {
  commit() { }
}

class RefPart extends DefaultAttributePart {
  setValue(value) {
    if (value !== this.value) {
      if (isFunction(value)) {
        this.value = value;
        this.value(this.committer.element);
      } else {
        super.setValue(value);
      }
    }
  }
}

class PropertyCommitter extends DefaultPropertyCommitter {
  commit() {
    if (this.dirty) {
      if (this.element instanceof Element) {
        this.dirty = false;
        this.element.properties = this.element.properties || {};
        this.element.properties[this.name] = this._getValue();
      } else {
        return super.commit();
      }
    }
  }
}

class TemplateProcessor extends DefaultTemplateProcessor {
  handleAttributeExpressions(element, name, strings, options) {
    const prefix = name[0];

    if (prefix === '.') {
      return new PropertyCommitter(element, name.slice(1), strings).parts;
    }

    if (name === 'class') {
      const committer = new DefaultAttributeCommitter(element, name, strings);
      committer.parts = [new ClassPart(committer)];

      return committer.parts;
    }

    if (name === 'style') {
      const committer = new DefaultAttributeCommitter(element, name, strings);
      committer.parts = [new StylePart(committer)];

      return committer.parts;
    }

    if (name === 'ref') {
      const committer = new RefCommitter(element, name, strings);
      committer.parts = [new RefPart(committer)];

      return committer.parts;
    }

    return super.handleAttributeExpressions(element, name, strings, options);
  }
}

export const templateProcessor = new TemplateProcessor();