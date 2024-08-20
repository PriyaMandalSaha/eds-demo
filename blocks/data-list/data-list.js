import { fetchPlaceholders } from '../../scripts/aem.js';

// Fetch placeholders
const placeholders = await fetchPlaceholders('');

const {
    dataListSNo, dataListCountries, dataListContinent, dataListCapital, dataListAbbreviation,
} = placeholders;

async function createHeaderDiv(container) {
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('header-div');

  const headers = [dataListSNo, dataListCountries, dataListContinent, dataListCapital, dataListAbbreviation];
  headers.forEach((headerText) => {
    const headerItem = document.createElement('div');
    headerItem.classList.add('header-item');
    headerItem.textContent = headerText;
    headerDiv.append(headerItem);
  });

  container.append(headerDiv);
}

async function createRowDiv(container, row, i) {
  const rowDiv = document.createElement('div');
  rowDiv.classList.add('row-div');

  const data = [i, row.Country, row.Continent, row.Capital, row.Abbreviation];
  data.forEach((dataItemText) => {
    const rowItem = document.createElement('div');
    rowItem.classList.add('row-item');
    rowItem.textContent = dataItemText;
    rowDiv.append(rowItem);
  });

  container.append(rowDiv);
}

async function createDivStructure(jsonURL, offset = 0, limit = 20) {
  const url = new URL(jsonURL);
  url.searchParams.set('offset', offset);
  url.searchParams.set('limit', limit);

  const resp = await fetch(url);
  const json = await resp.json(); // Fetch and assign the JSON data

  const container = document.createElement('div');
  container.classList.add('data-container');

  await createHeaderDiv(container);
  json.data.forEach((row, i) => {
    createRowDiv(container, row, offset + i + 1);
  });

  return container;
}

async function createPaginationControls(container, jsonURL, currentOffset, limit) {
  const paginationDiv = document.createElement('div');
  paginationDiv.classList.add('pagination-controls');

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.disabled = currentOffset === 0;
  prevButton.addEventListener('click', async () => {
    container.innerHTML = '';
    const newOffset = Math.max(0, currentOffset - limit);
    const newContent = await createDivStructure(jsonURL, newOffset, limit);
    container.append(newContent);
    createPaginationControls(container, jsonURL, newOffset, limit);
  });

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.addEventListener('click', async () => {
    container.innerHTML = '';
    const newOffset = currentOffset + limit;
    const newContent = await createDivStructure(jsonURL, newOffset, limit);
    container.append(newContent);
    createPaginationControls(container, jsonURL, newOffset, limit);
  });

  paginationDiv.append(prevButton, nextButton);
  container.append(paginationDiv);
}

export default async function decorate(block) {
  const countriesLink = block.querySelector('a[href$=".json"]');
  const parentDiv = document.createElement('div');
  parentDiv.classList.add('countries-block');

  if (countriesLink) {
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');

    parentDiv.append(contentContainer);
    const initialContent = await createDivStructure(countriesLink.href, 0, 20);
    contentContainer.append(initialContent);
    createPaginationControls(contentContainer, countriesLink.href, 0, 20);


    countriesLink.replaceWith(parentDiv);
  }
}
