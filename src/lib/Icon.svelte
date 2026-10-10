<script>
  let { name, size = 16 } = $props()

  const paths = {
    undo: 'M6 4 3 7l3 3M3 7h6.5a3.5 3.5 0 0 1 0 7H7',
    redo: 'M10 4l3 3-3 3M13 7H6.5a3.5 3.5 0 0 0 0 7H9',
    upload: 'M8 11V3M5 6l3-3 3 3M3 13h10',
    download: 'M8 3v8M5 8l3 3 3-3M3 13h10',
    plus: 'M8 3v10M3 8h10',
    x: 'M4 4l8 8M12 4l-8 8',
    table: 'M2.5 3.5h11v9h-11zM2.5 7h11M2.5 10h11M6.5 3.5v9',
    calc: 'M4 2.5h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM5.5 5h5M5.5 8h1M9.5 8h1M5.5 10.5h1M9.5 10.5h1',
    pen: 'M3 13l.7-3L10.5 3.2a1.4 1.4 0 0 1 2 2L5.7 12.3zM9.2 4.5l2.3 2.3',
    cube: 'M8 2l5 2.7v6.6L8 14l-5-2.7V4.7zM3 4.7l5 2.8 5-2.8M8 7.5V14',
    chevron: 'M4 6l4 4 4-4'
  }
</script>

<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={paths[name]} />
</svg>
