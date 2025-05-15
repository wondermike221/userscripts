import { createSignal } from 'solid-js';
import Directory from './Directory';

type Topping = 'Lettuce' | 'Tomato' | 'Onion' | 'Cheese';

const toppings: Topping[] = ['Lettuce', 'Tomato', 'Onion', 'Cheese'];

export default function BurgerToppingsDirectoryExample() {
  const [selectedToppings, setSelectedToppings] = createSignal<
    Record<Topping, boolean>
  >({
    Lettuce: false,
    Tomato: false,
    Onion: false,
    Cheese: false,
  });
  const [current, setCurrent] = createSignal<'root' | Topping>('root');

  const handleToppingChoice = (topping: Topping, include: boolean) => {
    setSelectedToppings((prev) => ({ ...prev, [topping]: include }));
    setCurrent('root');
  };

  // Root directory: list toppings
  if (current() === 'root') {
    return (
      <Directory
        title="Choose a topping to include/exclude"
        entries={toppings.map((topping) => ({
          id: topping,
          label: topping,
          description: selectedToppings()[topping]
            ? 'Included'
            : 'Not included',
          onClick: () => setCurrent(topping),
        }))}
      />
    );
  }

  // Subdirectory: Yes/No for a topping
  const topping = current() as Topping;
  return (
    <Directory
      title={`Include ${topping}?`}
      entries={[
        {
          id: 'yes',
          label: 'Yes',
          onClick: () => handleToppingChoice(topping, true),
        },
        {
          id: 'no',
          label: 'No',
          onClick: () => handleToppingChoice(topping, false),
        },
      ]}
      style={{ minWidth: '180px' }}
    />
  );
}
