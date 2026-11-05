import {
  createButton, createIconButton, createBadge, createCard, createSeparator, createTooltip,
  createInput, createTextarea, createCheckbox, createRadioGroup, createSwitch, createSelect, createFormField,
  createTabs, createBreadcrumb, createMenu, createPagination, createDialog, createAlert, createToast
} from '../../packages/core/dist/index.js';

const container = document.querySelector('#examples');
const status = document.querySelector('#event-status');
const reset = document.querySelector('#reset');
if (!container || !status || !reset) throw new Error('Example mount points are missing');
let handles = [];
const remember = component => { handles.push(component); return component; };
const announce = text => { status.textContent = text; };
function section(name, heading) {
  const element = document.createElement('section'); element.className = 'example'; element.dataset.component = name;
  const title = document.createElement('h2'); title.textContent = heading; element.append(title); container.append(element); return element;
}
function labelControl(parent, component, text) {
  const label = document.createElement('label'); label.htmlFor = component.element.id; label.textContent = text;
  parent.append(label, component.element);
}
function render() {
  const button = remember(createButton({ label: 'Save', onClick: () => announce('Save activated') }));
  section('button', 'Button').append(button.element);

  const icon = remember(createIconButton({ label: 'Open settings', icon: '⚙', variant: 'secondary', onClick: () => announce('Settings activated') }));
  section('icon-button', 'Icon button').append(icon.element);
  section('badge', 'Badge').append(remember(createBadge({ label: 'Active', variant: 'success' })).element);
  const card = remember(createCard({ label: 'Account summary', variant: 'elevated' })); card.element.textContent = 'Account details';
  section('card', 'Card').append(card.element);
  section('separator', 'Separator').append(remember(createSeparator()).element);
  const tooltipTrigger = document.createElement('button'); tooltipTrigger.type = 'button'; tooltipTrigger.textContent = 'More information';
  const tooltip = remember(createTooltip({ trigger: tooltipTrigger, text: 'Use this control for additional context.' }));
  section('tooltip', 'Tooltip').append(tooltip.element);

  const input = remember(createInput({ id: 'example-name', placeholder: 'Name' }));
  labelControl(section('input', 'Input'), input, 'Name');
  const textarea = remember(createTextarea({ id: 'example-notes', placeholder: 'Notes' }));
  labelControl(section('textarea', 'Textarea'), textarea, 'Notes');
  section('checkbox', 'Checkbox').append(remember(createCheckbox({ id: 'example-terms', label: 'Accept terms' })).element);
  section('radio-group', 'Radio group').append(remember(createRadioGroup({ id: 'example-plan', legend: 'Plan', name: 'plan', options: [{ value: 'basic', label: 'Basic' }, { value: 'plus', label: 'Plus' }] })).element);
  section('switch', 'Switch').append(remember(createSwitch({ id: 'example-notifications', label: 'Notifications' })).element);
  const select = remember(createSelect({ id: 'example-country', options: [{ value: 'sg', label: 'Singapore' }, { value: 'my', label: 'Malaysia' }] }));
  labelControl(section('select', 'Select'), select, 'Country');
  const email = remember(createInput({ id: 'example-email', type: 'email', required: true }));
  const field = remember(createFormField({ label: 'Email', control: email.element, description: 'Enter an email address.' }));
  section('form-field', 'Form field').append(field.element);

  section('tabs', 'Tabs').append(remember(createTabs({ label: 'Example views', tabs: [{ label: 'Overview', content: 'Overview content' }, { label: 'Details', content: 'Details content' }] })).element);
  section('breadcrumb', 'Breadcrumb').append(remember(createBreadcrumb([{ label: 'Examples', href: './' }, { label: 'Current page' }])).element);
  section('menu', 'Menu').append(remember(createMenu({ label: 'Actions', items: [{ label: 'Archive', onSelect: () => announce('Archive selected') }, { label: 'Unavailable', disabled: true, onSelect: () => announce('Unexpected activation') }] })).element);
  section('pagination', 'Pagination').append(remember(createPagination({ page: 1, totalPages: 3, onChange: page => announce(`Page ${page} selected`) })).element);
  const dialog = remember(createDialog({ title: 'Example dialog', description: 'Press Escape or Close to return to the opener.' }));
  const openDialog = remember(createButton({ label: 'Open dialog', onClick: () => dialog.open(openDialog.element) }));
  section('dialog', 'Dialog').append(openDialog.element, dialog.element);
  section('alert', 'Alert').append(remember(createAlert({ message: 'Review your settings before continuing.', tone: 'warning' })).element);
  section('toast', 'Toast').append(remember(createToast({ message: 'Example saved', onDismiss: () => announce('Toast dismissed') })).element);
}
function clear() {
  for (const handle of handles.reverse()) handle.destroy();
  handles = []; container.replaceChildren(); status.textContent = '';
}
reset.addEventListener('click', () => { clear(); render(); announce('Examples reset'); });
render();
