import { addInViewAnimationToSingleElement } from '../../utils/helper.js';

function createSelect(fromdata) {
  const select = document.createElement('select');
  select.id = fromdata.Field;
  if (fromdata.Placeholder) {
    const ph = document.createElement('option');
    ph.textContent = fromdata.Placeholder;
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    select.append(ph);
  }
  fromdata.Options.split(',').forEach((o) => {
    const option = document.createElement('option');
    option.textContent = o.trim();
    option.value = o.trim();
    select.append(option);
  });
  if (fromdata.Mandatory === 'x') {
    select.setAttribute('required', 'required');
  }
  return select;
}

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

async function submitForm(form) {
  const payload = constructPayload(form);
  payload.timestamp = new Date().toJSON();
  const resp = await fetch(form.dataset.action, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  });
  await resp.text();
  return payload;
}

function createButton(fromdata) {
  const button = document.createElement('button');
  button.textContent = fromdata.Label;
  button.classList.add('button');
  if (fromdata.Type === 'submit') {
    button.addEventListener('click', async (event) => {
      const form = button.closest('form');
      if (fromdata.Placeholder) form.dataset.action = fromdata.Placeholder;
      if (form.checkValidity()) {
        event.preventDefault();
        button.setAttribute('disabled', '');
        await submitForm(form);
        const redirectTo = fromdata.Extra;
        window.location.href = redirectTo;
      }
    });
  }
  return button;
}

function createHeading(fromdata, el) {
  const heading = document.createElement(el);
  heading.textContent = fromdata.Label;
  return heading;
}

function createInput(fromdata) {
  const input = document.createElement('input');
  input.type = fromdata.Type;
  input.id = fromdata.Field;
  input.setAttribute('placeholder', fromdata.Placeholder);
  if (fromdata.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function createTextArea(fromdata) {
  const input = document.createElement('textarea');
  input.id = fromdata.Field;
  input.setAttribute('placeholder', fromdata.Placeholder);
  if (fromdata.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function createLabel(fromdata) {
  const label = document.createElement('label');
  label.setAttribute('for', fromdata.Field);
  label.textContent = fromdata.Label;
  if (fromdata.Mandatory === 'x') {
    label.classList.add('required');
  }
  return label;
}

function applyRules(form, rules) {
  const payload = constructPayload(form);
  rules.forEach((field) => {
    const { type, condition: { key, operator, value } } = field.rule;
    if (type === 'visible') {
      if (operator === 'eq') {
        if (payload[key] === value) {
          form.querySelector(`.${field.fieldId}`).classList.remove('hidden');
        } else {
          form.querySelector(`.${field.fieldId}`).classList.add('hidden');
        }
      }
    }
  });
}

function fill(form) {
  const { action } = form.dataset;
  if (action === '/tools/bot/register-form') {
    const loc = new URL(window.location.href);
    form.querySelector('#owner').value = loc.searchParams.get('owner') || '';
    form.querySelector('#installationId').value = loc.searchParams.get('id') || '';
  }
}

export async function createForm(formURL) {
  const { pathname } = new URL(formURL);
  const resp = await fetch(pathname);
  const json = await resp.json();
  const form = document.createElement('form');
  const rules = [];
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];
  json.data.forEach((fromdata) => {
    fromdata.Type = fromdata.Type || 'text';
    const fieldWrapper = document.createElement('div');
    const style = fromdata.Style ? ` form-${fromdata.Style}` : '';
    const fieldId = `form-${fromdata.Type}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper');
    switch (fromdata.Type) {
      case 'select':
        fieldWrapper.append(createLabel(fromdata));
        fieldWrapper.append(createSelect(fromdata));
        break;
      case 'heading':
        fieldWrapper.append(createHeading(fromdata, 'h3'));
        break;
      case 'legal':
        fieldWrapper.append(createHeading(fromdata, 'p'));
        break;
      case 'checkbox':
        fieldWrapper.append(createInput(fromdata));
        fieldWrapper.append(createLabel(fromdata));
        break;
      case 'text-area':
        fieldWrapper.append(createLabel(fromdata));
        fieldWrapper.append(createTextArea(fromdata));
        break;
      case 'submit':
        fieldWrapper.append(createButton(fromdata));
        break;
      default:
        fieldWrapper.append(createLabel(fromdata));
        fieldWrapper.append(createInput(fromdata));
    }

    if (fromdata.Rules) {
      try {
        rules.push({ fieldId, rule: JSON.parse(fromdata.Rules) });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Invalid Rule ${fromdata.Rules}: ${e}`);
      }
    }
    form.append(fieldWrapper);
  });

  form.addEventListener('change', () => applyRules(form, rules));
  applyRules(form, rules);
  fill(form);
  return (form);
}

export default async function decorate(block) {
  const form = block.querySelector('a[href$=".json"]');
  addInViewAnimationToSingleElement(block, 'fade-up');
  if (form) {
    form.replaceWith(await createForm(form.href));
  }
}
