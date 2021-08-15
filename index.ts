import { fromEvent, from, of, Observable } from 'rxjs'; 
import { debounceTime, map, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

const input = document.querySelector('input');
const ul = document.querySelector('ul');

fromEvent(input, 'keyup').pipe(
  debounceTime(700),
  map(event => event.target.value),
  filter(val => val.length > 2),
  distinctUntilChanged(),
  switchMap(value => {
    return getUsersRepsFromAPI(value).pipe(
      catchError(err => of([]))
    )
  })
).subscribe({
  next: reps => recordRepsToList(reps)
})

const recordRepsToList = (reps) => {
  for (let i = 0; i < reps.length; i++) {

    // если элемент не существует, то создаем его
    if (!ul.children[i]) {
      const newEl = document.createElement('li');
      ul.appendChild(newEl);
    }

    // записываем название репозитория в элемент
    const li = ul.children[i];
    li.innerHTML = reps[i].name;
  }

  // удаляем оставшиеся элементы
  while (ul.children.length > reps.length) {
    ul.removeChild(ul.lastChild);
  }
}

const getUsersRepsFromAPI = (username) => {
  const url = `https://api.github.com/users/${ username }/repos`;
  return createCancellableRequest(url);
}


const createCancellableRequest = (url) => {
  const controller = new AbortController();
  const signal = controller.signal;

  return new Observable(observer => {
  
    fetch(url, { signal })
      .then(response => {
        if(response.ok) {
          return response.json();
        }

        throw new Error('Ошибка');
      })
      .then(result => observer.next(result))
      .then(() => observer.complete())
      .catch(error => observer.error(error));

    return () => {
      controller.abort();
    };
  });
}