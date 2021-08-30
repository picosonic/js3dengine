var keystate=0;
thiskey=0;

function updatekeystate(e, dir)
{
  switch (e.which)
  {
    case 37: // cursor left
      if (dir==1)
        keystate|=1;
      else
        keystate&=~1;
      e.preventDefault();
      break;

    case 38: // cursor up
      if (dir==1)
        keystate|=2;
      else
        keystate&=~2;
      e.preventDefault();
      break;

    case 39: // cursor right
      if (dir==1)
        keystate|=4;
      else
        keystate&=~4;
      e.preventDefault();
      break;

    case 40: // cursor down
      if (dir==1)
        keystate|=8;
      else
        keystate&=~8;
      e.preventDefault();
      break;

    case 13: // enter
    case 32: // space
      if (dir==1)
        keystate|=16;
      else
        keystate&=~16;
      e.preventDefault();
      break;

    case 65: // A
    case 90: // Z
      if (dir==1)
        keystate|=128;
      else
        keystate&=~128;
      e.preventDefault();
      break;

    case 87: // W
    case 59: // semicolon
      if (dir==1)
        keystate|=32;
      else
        keystate&=~32;
      e.preventDefault();
      break;

    case 68: // D
    case 88: // X
      if (dir==1)
        keystate|=256;
      else
        keystate&=~256;
      e.preventDefault();
      break;

    case 83: // S
    case 190: // dot
      if (dir==1)
        keystate|=64;
      else
        keystate&=~64;
      e.preventDefault();
      break;


    case 27: // escape
      e.preventDefault();
      break;

    default:
      break;
  }

  if (dir==1)
    thiskey=e.which;
}
